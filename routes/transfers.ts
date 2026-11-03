/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { type Request, type Response } from 'express'
import { Op } from 'sequelize'
import { BankAccountModel } from '../models/bankAccount'
import { TransferModel } from '../models/transfer'
import { UserModel } from '../models/user'
import * as challengeUtils from '../lib/challengeUtils'
import { challenges } from '../data/datacache'
import * as security from '../lib/insecurity'

const screenTransfer = async () => await new Promise(resolve => setTimeout(resolve, 150))

export function getTransfers () {
  return async (req: Request, res: Response) => {
    const user = security.authenticatedUsers.from(req)
    const accounts = await BankAccountModel.findAll({ where: { UserId: user?.data.id }, attributes: ['id'] })
    const accountIds = accounts.map(account => account.id)
    const transfers = await TransferModel.findAll({
      where: {
        [Op.or]: [
          { fromAccountId: { [Op.in]: accountIds } },
          { toAccountId: { [Op.in]: accountIds } }
        ]
      },
      order: [['createdAt', 'DESC']]
    })
    res.status(200).json({ status: 'success', data: transfers })
  }
}

export function createTransfer () {
  return async (req: Request, res: Response) => {
    const user = security.authenticatedUsers.from(req)
    const { fromAccountId, toAccountId, recipientEmail, amount, memo } = req.body
    const transferAmount = Number(amount)
    if (!Number.isFinite(transferAmount) || transferAmount <= 0) {
      res.status(400).json({ status: 'error', message: 'Transfer amount must be greater than zero.' })
      return
    }

    const fromAccount = await BankAccountModel.findByPk(fromAccountId)
    if (fromAccount == null) {
      res.status(404).json({ status: 'error', message: 'Source account not found.' })
      return
    }

    let destinationAccount: BankAccountModel | null = null
    const resolvedRecipientEmail = recipientEmail ?? null
    if (recipientEmail) {
      const recipient = await UserModel.findOne({ where: { email: recipientEmail } })
      destinationAccount = recipient == null ? null : await BankAccountModel.findOne({ where: { UserId: recipient.id, type: 'CHEQUING' } })
      if (destinationAccount == null) {
        res.status(404).json({ status: 'error', message: 'Recipient not found.' })
        return
      }
    } else if (toAccountId != null) {
      destinationAccount = await BankAccountModel.findByPk(toAccountId)
      if (destinationAccount == null) {
        res.status(404).json({ status: 'error', message: 'Destination account not found.' })
        return
      }
    } else {
      res.status(400).json({ status: 'error', message: 'A destination account or recipient is required.' })
      return
    }

    const availableBalance = Number(fromAccount.balance)
    if (availableBalance < transferAmount) {
      res.status(402).json({ status: 'error', message: 'Insufficient funds.' })
      return
    }

    challengeUtils.solveIf(challenges.etransferBolaChallenge, () => fromAccount.UserId !== user?.data.id)
    await screenTransfer()

    await BankAccountModel.decrement({ balance: transferAmount }, { where: { id: fromAccount.id } })
    if (destinationAccount != null) {
      await BankAccountModel.increment({ balance: transferAmount }, { where: { id: destinationAccount.id } })
    }
    const currentBalance = await BankAccountModel.findByPk(fromAccount.id)
    challengeUtils.solveIf(challenges.etransferRaceChallenge, () => Number(currentBalance?.balance) < 0)

    const transfer = await TransferModel.create({
      fromAccountId: fromAccount.id,
      toAccountId: destinationAccount?.id ?? null,
      recipientEmail: resolvedRecipientEmail,
      amount: transferAmount,
      memo: memo ?? null
    })
    res.status(201).json({ status: 'success', data: transfer })
  }
}
