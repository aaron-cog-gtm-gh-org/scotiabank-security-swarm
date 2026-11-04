/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { type Request, type Response } from 'express'
import { BankAccountModel } from '../models/bankAccount'
import { ScenePointsModel } from '../models/scenePoints'
import * as models from '../models/index'
import * as security from '../lib/insecurity'

export const rewards = [
  { id: 1, name: '$10 statement credit', points: 1000, value: 10 },
  { id: 2, name: 'Cineplex movie ticket', points: 1250, value: 0 },
  { id: 3, name: '$25 Home Hardware gift card', points: 2500, value: 0 },
  { id: 4, name: 'Travel credit $100', points: 10000, value: 0 }
]

export function getScenePlus () {
  return async (req: Request, res: Response) => {
    const user = security.authenticatedUsers.from(req)
    const points = await ScenePointsModel.findOne({ where: { UserId: user?.data.id } })
    res.status(200).json({ status: 'success', data: { points: points?.points ?? 0, rewards } })
  }
}

const MAX_REDEMPTION_QUANTITY = 100

type RedemptionResult =
  | { status: 200, data: { points: number, reward: typeof rewards[number], quantity: number, cost: number, chequingBalance: number | null } }
  | { status: 402 | 404, message: string }

// Sequelize shares one SQLite connection, so overlapping transactions would interleave.
let redemptionQueue: Promise<unknown> = Promise.resolve()
async function serializeRedemption<T> (task: () => Promise<T>): Promise<T> {
  const run = redemptionQueue.then(task, task)
  redemptionQueue = run.catch(() => undefined)
  return await run
}

export function redeemScenePlus () {
  return async (req: Request, res: Response) => {
    const user = security.authenticatedUsers.from(req)
    const reward = rewards.find(candidate => candidate.id === Number(req.body.rewardId))
    const quantity = Number(req.body.quantity)
    if (reward == null || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_REDEMPTION_QUANTITY) {
      res.status(400).json({ status: 'error', message: 'Invalid reward or quantity.' })
      return
    }

    const cost = reward.points * quantity
    const credit = reward.value * quantity
    if (!Number.isSafeInteger(cost) || !Number.isSafeInteger(credit)) {
      res.status(400).json({ status: 'error', message: 'Invalid reward or quantity.' })
      return
    }

    const result = await serializeRedemption(async () => await models.sequelize.transaction(async (transaction): Promise<RedemptionResult> => {
      const points = await ScenePointsModel.findOne({ where: { UserId: user?.data.id }, transaction })
      if (points == null) {
        return { status: 404, message: 'Scene+ account not found.' }
      }
      if (Number(points.points) < cost) {
        return { status: 402, message: 'Not enough Scene+ points.' }
      }

      let chequingBalance: number | null = null
      if (credit !== 0) {
        const account = await BankAccountModel.findOne({ where: { UserId: user?.data.id, type: 'CHEQUING' }, transaction })
        if (account == null) {
          return { status: 404, message: 'Chequing account not found.' }
        }
        await account.increment({ balance: credit }, { transaction })
        await account.reload({ transaction })
        chequingBalance = account.balance
      }

      points.points = Number(points.points) - cost
      await points.save({ transaction })
      return { status: 200, data: { points: points.points, reward, quantity, cost, chequingBalance } }
    }))

    if (result.status === 200) {
      res.status(200).json({ status: 'success', data: result.data })
    } else {
      res.status(result.status).json({ status: 'error', message: result.message })
    }
  }
}
