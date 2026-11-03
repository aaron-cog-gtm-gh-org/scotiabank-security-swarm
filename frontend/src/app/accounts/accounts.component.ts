/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { DecimalPipe, DatePipe } from '@angular/common'
import { Component, ChangeDetectionStrategy, type OnInit, inject, ViewChild } from '@angular/core'
import { FormControl, FormGroup, FormGroupDirective, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { InvestmentService, type BankAccount, type Transfer } from '../Services/investment.service'
import { SnackBarHelperService } from '../Services/snack-bar-helper.service'

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-accounts',
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.scss'],
  imports: [DecimalPipe, DatePipe, FormsModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule]
})
export class AccountsComponent implements OnInit {
  @ViewChild(FormGroupDirective) private formDirective?: FormGroupDirective
  private readonly investmentService = inject(InvestmentService)
  private readonly snackBar = inject(SnackBarHelperService)

  accounts: BankAccount[] = []
  transfers: Transfer[] = []
  loading = true
  submitting = false
  errorMessage = ''
  destinationMode: 'email' | 'internal' = 'email'
  transferForm = new FormGroup({
    fromAccountId: new FormControl<number | null>(null, Validators.required),
    recipientEmail: new FormControl('', [Validators.email]),
    toAccountId: new FormControl<number | null>(null),
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    memo: new FormControl('')
  })

  ngOnInit (): void {
    this.loadData()
  }

  get totalBalance (): number {
    return this.accounts.reduce((total, account) => total + Number(account.balance), 0)
  }

  setDestinationMode (mode: 'email' | 'internal'): void {
    this.destinationMode = mode
    this.transferForm.controls.recipientEmail.reset()
    this.transferForm.controls.toAccountId.reset()
  }

  submitTransfer (): void {
    this.errorMessage = ''
    if (this.transferForm.invalid || this.submitting) {
      this.transferForm.markAllAsTouched()
      return
    }

    const value = this.transferForm.getRawValue()
    const transfer = {
      fromAccountId: value.fromAccountId as number,
      amount: Number(value.amount),
      memo: value.memo ?? ''
    }
    if (this.destinationMode === 'email') {
      if (!value.recipientEmail) {
        this.transferForm.controls.recipientEmail.setErrors({ required: true })
        return
      }
      Object.assign(transfer, { recipientEmail: value.recipientEmail })
    } else {
      if (!value.toAccountId) {
        this.transferForm.controls.toAccountId.setErrors({ required: true })
        return
      }
      Object.assign(transfer, { toAccountId: value.toAccountId })
    }

    this.submitting = true
    this.investmentService.createTransfer(transfer).subscribe({
      next: () => {
        this.snackBar.open('Transfer sent successfully.')
        this.formDirective?.resetForm()
        this.transferForm.reset({ fromAccountId: this.accounts[0]?.id ?? null, recipientEmail: '', toAccountId: null, amount: null, memo: '' })
        this.loadData()
      },
      error: (err) => {
        this.errorMessage = this.getErrorMessage(err)
        this.submitting = false
      }
    })
  }

  maskedAccountNumber (accountNumber: string): string {
    return `•••• ${accountNumber.slice(-4)}`
  }

  private loadData (): void {
    this.loading = true
    this.investmentService.getAccounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts
        if (!this.transferForm.controls.fromAccountId.value) this.transferForm.controls.fromAccountId.setValue(accounts[0]?.id ?? null)
        this.loading = false
        this.submitting = false
      },
      error: (err) => {
        this.errorMessage = this.getErrorMessage(err)
        this.loading = false
        this.submitting = false
      }
    })
    this.investmentService.getTransfers().subscribe({
      next: (transfers) => { this.transfers = transfers },
      error: (err) => { this.errorMessage = this.getErrorMessage(err) }
    })
  }

  private getErrorMessage (err: any): string {
    return err?.error?.message ?? err?.error?.data?.message ?? err?.message ?? 'We could not complete that request.'
  }
}
