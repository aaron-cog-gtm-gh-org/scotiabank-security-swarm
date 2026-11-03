/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { type Request, type Response } from 'express'
import { BankAccountModel } from '../models/bankAccount'
import * as security from '../lib/insecurity'

export function getAccounts () {
  return async (req: Request, res: Response) => {
    const user = security.authenticatedUsers.from(req)
    const accounts = await BankAccountModel.findAll({ where: { UserId: user?.data.id }, order: [['id', 'ASC']] })
    res.status(200).json({ status: 'success', data: accounts })
  }
}
