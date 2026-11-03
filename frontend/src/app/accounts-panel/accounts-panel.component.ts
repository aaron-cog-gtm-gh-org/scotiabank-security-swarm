/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { Component, ChangeDetectionStrategy, type OnInit, inject } from '@angular/core'
import { DecimalPipe } from '@angular/common'
import { RouterLink } from '@angular/router'
import { MatIconModule } from '@angular/material/icon'
import { InvestmentService } from '../Services/investment.service'

interface MockAccount {
  name: string
  number: string
  balance: number
  change?: number
}

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-accounts-panel',
  templateUrl: './accounts-panel.component.html',
  styleUrls: ['./accounts-panel.component.scss'],
  imports: [DecimalPipe, RouterLink, MatIconModule]
})
export class AccountsPanelComponent implements OnInit {
  private readonly investmentService = inject(InvestmentService)
  liveAccounts = false
  errorMessage = ''
  accounts: MockAccount[] = [
    { name: 'RRSP', number: '••• 4021', balance: 214_760.33, change: 0.44 },
    { name: 'TFSA', number: '••• 7715', balance: 118_402.19, change: 0.51 },
    { name: 'Cash (CAD)', number: '••• 1180', balance: 96_318.4, change: -0.12 },
    { name: 'RESP', number: '••• 3306', balance: 57_831.66, change: 0.27 }
  ]

  ngOnInit (): void {
    if (!localStorage.getItem('token')) return
    this.liveAccounts = true
    this.accounts = []
    this.investmentService.getAccounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts.map(account => ({ name: account.nickname, number: `•••• ${account.accountNumber.slice(-4)}`, balance: Number(account.balance) }))
      },
      error: () => { this.errorMessage = 'Your accounts could not be loaded.' }
    })
  }

  get totalBalance (): number {
    return this.accounts.reduce((total, account) => total + account.balance, 0)
  }
}
