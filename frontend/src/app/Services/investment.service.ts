/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { environment } from '../../environments/environment'
import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { catchError, map } from 'rxjs/operators'

export interface BankAccount {
  id: number
  UserId: number
  type: string
  nickname: string
  accountNumber: string
  balance: number
}

export interface Transfer {
  id: number
  fromAccountId: number
  toAccountId: number | null
  recipientEmail: string | null
  amount: number
  memo: string | null
  createdAt: string
}

export interface SceneReward {
  id: number
  name: string
  points: number
  value: number
}

export interface ScenePlus {
  points: number
  rewards: SceneReward[]
}

@Injectable({ providedIn: 'root' })
export class InvestmentService {
  private readonly http = inject(HttpClient)
  private readonly host = environment.hostServer + '/rest'

  getAccounts () {
    return this.http.get<{ data: BankAccount[] }>(this.host + '/accounts').pipe(map(response => response.data), catchError((err) => { throw err }))
  }

  getTransfers () {
    return this.http.get<{ data: Transfer[] }>(this.host + '/transfers').pipe(map(response => response.data), catchError((err) => { throw err }))
  }

  createTransfer (transfer: { fromAccountId: number, toAccountId?: number, recipientEmail?: string, amount: number, memo?: string }) {
    return this.http.post<{ data: Transfer }>(this.host + '/transfers', transfer).pipe(map(response => response.data), catchError((err) => { throw err }))
  }

  getScenePlus () {
    return this.http.get<{ data: ScenePlus }>(this.host + '/scene-plus').pipe(map(response => response.data), catchError((err) => { throw err }))
  }

  redeemScenePlus (rewardId: number, quantity: number) {
    return this.http.post<{ data: { points: number, cost: number, chequingBalance: number | null } }>(this.host + '/scene-plus/redeem', { rewardId, quantity }).pipe(map(response => response.data), catchError((err) => { throw err }))
  }
}
