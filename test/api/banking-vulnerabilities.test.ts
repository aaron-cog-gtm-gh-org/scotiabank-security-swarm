/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import type { Express } from 'express'
import config from 'config'
import { createTestApp } from './helpers/setup'
import { login } from './helpers/auth'

let app: Express
let jimToken: string
let adminToken: string
const domain = config.get<string>('application.domain')

const auth = (token: string) => ({ Authorization: `Bearer ${token}`, 'content-type': 'application/json' })

async function challengeSolved (key: string) {
  const response = await request(app).get(`/api/Challenges/?key=${key}`)
  return response.body.data?.some((challenge: { key: string, solved: boolean }) => challenge.key === key && challenge.solved)
}

before(async () => {
  const result = await createTestApp()
  app = result.app
  jimToken = (await login(app, { email: `jim@${domain}`, password: 'ncc-1701' })).token
  adminToken = (await login(app, { email: `admin@${domain}`, password: 'admin123' })).token
}, { timeout: 60000 })

void describe('/rest/accounts', () => {
  void it('returns only the logged-in user accounts', async () => {
    const response = await request(app).get('/rest/accounts').set(auth(jimToken))
    assert.equal(response.status, 200)
    assert.equal(response.body.data.length, 4)
    assert.ok(response.body.data.every((account: { UserId: number }) => account.UserId !== 1))
  })
})

void describe('/rest/transfers', () => {
  void it('allows a transfer from another user account and solves BOLA', async () => {
    const accounts = (await request(app).get('/rest/accounts').set(auth(adminToken))).body.data
    const jimAccounts = (await request(app).get('/rest/accounts').set(auth(jimToken))).body.data
    const response = await request(app)
      .post('/rest/transfers')
      .set(auth(jimToken))
      .send({ fromAccountId: accounts[0].id, toAccountId: jimAccounts[0].id, amount: 1, memo: 'test' })

    assert.equal(response.status, 201)
    assert.equal(await challengeSolved('etransferBolaChallenge'), true)
  })

  void it('allows parallel requests to overdraw an account', async () => {
    const accounts = (await request(app).get('/rest/accounts').set(auth(jimToken))).body.data
    const source = accounts.find((account: { type: string }) => account.type === 'CHEQUING')
    const destination = accounts.find((account: { type: string }) => account.type === 'SAVINGS')
    const responses = await Promise.all(new Array(10).fill(null).map(async () => await request(app)
      .post('/rest/transfers')
      .set(auth(jimToken))
      .send({ fromAccountId: source.id, toAccountId: destination.id, amount: 500, memo: 'parallel test' })))

    assert.ok(responses.every(response => response.status === 201))
    const updated = (await request(app).get('/rest/accounts').set(auth(jimToken))).body.data
    assert.ok(updated.find((account: { id: number }) => account.id === source.id).balance < 0)
    assert.equal(await challengeSolved('etransferRaceChallenge'), true)
  })
})

async function sceneBalances (token: string) {
  const points = (await request(app).get('/rest/scene-plus').set(auth(token))).body.data.points
  const accounts = (await request(app).get('/rest/accounts').set(auth(token))).body.data
  const chequing = accounts.find((account: { type: string }) => account.type === 'CHEQUING').balance
  return { points, chequing }
}

void describe('/rest/scene-plus/redeem', () => {
  for (const quantity of [-1, 0, 1.5, 101, 2147484, 4294966, '-1', null]) {
    void it(`rejects quantity ${JSON.stringify(quantity)} without changing balances`, async () => {
      const before = await sceneBalances(jimToken)
      const response = await request(app)
        .post('/rest/scene-plus/redeem')
        .set(auth(jimToken))
        .send({ rewardId: 1, quantity })

      assert.equal(response.status, 400)
      assert.deepEqual(await sceneBalances(jimToken), before)
    })
  }

  void it('rejects a redemption that costs more than the available points', async () => {
    const before = await sceneBalances(jimToken)
    const response = await request(app)
      .post('/rest/scene-plus/redeem')
      .set(auth(jimToken))
      .send({ rewardId: 4, quantity: 100 })

    assert.equal(response.status, 402)
    assert.deepEqual(await sceneBalances(jimToken), before)
  })

  void it('debits points and credits chequing for a valid redemption', async () => {
    const before = await sceneBalances(jimToken)
    const response = await request(app)
      .post('/rest/scene-plus/redeem')
      .set(auth(jimToken))
      .send({ rewardId: 1, quantity: 2 })

    assert.equal(response.status, 200)
    assert.equal(response.body.data.cost, 2000)
    const after = await sceneBalances(jimToken)
    assert.equal(after.points, before.points - 2000)
    assert.equal(after.chequing, before.chequing + 20)
  })

  void it('does not overspend points under parallel redemptions', async () => {
    const before = await sceneBalances(jimToken)
    const affordable = Math.floor(before.points / 2500)
    const responses = await Promise.all(new Array(affordable + 3).fill(null).map(async () => await request(app)
      .post('/rest/scene-plus/redeem')
      .set(auth(jimToken))
      .send({ rewardId: 3, quantity: 1 })))

    assert.equal(responses.filter(response => response.status === 200).length, affordable)
    const after = await sceneBalances(jimToken)
    assert.equal(after.points, before.points - affordable * 2500)
  })
})
