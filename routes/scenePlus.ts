/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { type Request, type Response } from 'express'
import { BankAccountModel } from '../models/bankAccount'
import { ScenePointsModel } from '../models/scenePoints'
import * as challengeUtils from '../lib/challengeUtils'
import { challenges } from '../data/datacache'
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

export function redeemScenePlus () {
  return async (req: Request, res: Response) => {
    const user = security.authenticatedUsers.from(req)
    const reward = rewards.find(candidate => candidate.id === Number(req.body.rewardId))
    const quantity = Number(req.body.quantity)
    if (reward == null || !Number.isInteger(quantity) || !Number.isFinite(quantity)) {
      res.status(400).json({ status: 'error', message: 'Invalid reward or quantity.' })
      return
    }

    const points = await ScenePointsModel.findOne({ where: { UserId: user?.data.id } })
    if (points == null) {
      res.status(404).json({ status: 'error', message: 'Scene+ account not found.' })
      return
    }

    // The points ledger uses signed 32-bit integer arithmetic.
    const cost = Math.imul(reward.points, quantity)
    if (Number(points.points) < cost) {
      res.status(402).json({ status: 'error', message: 'Not enough Scene+ points.' })
      return
    }

    challengeUtils.solveIf(challenges.sceneNegativeRedeemChallenge, () => quantity < 0)
    challengeUtils.solveIf(challenges.sceneOverflowChallenge, () => quantity > 0 && cost < 0)
    points.points = (Number(points.points) - cost) | 0
    await points.save()

    let chequingBalance: number | null = null
    if (reward.value !== 0) {
      await BankAccountModel.increment({ balance: reward.value * quantity }, { where: { UserId: user?.data.id, type: 'CHEQUING' } })
      const account = await BankAccountModel.findOne({ where: { UserId: user?.data.id, type: 'CHEQUING' } })
      chequingBalance = account?.balance ?? null
    }
    res.status(200).json({ status: 'success', data: { points: points.points, reward, quantity, cost, chequingBalance } })
  }
}
