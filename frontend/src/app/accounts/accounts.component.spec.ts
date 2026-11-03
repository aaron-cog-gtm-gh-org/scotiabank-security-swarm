/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { TestBed, type ComponentFixture } from '@angular/core/testing'
import { of, throwError } from 'rxjs'
import { AccountsComponent } from './accounts.component'
import { InvestmentService } from '../Services/investment.service'
import { SnackBarHelperService } from '../Services/snack-bar-helper.service'

describe('AccountsComponent', () => {
  let component: AccountsComponent
  let fixture: ComponentFixture<AccountsComponent>
  let service: any
  let snackBar: any
  const accounts = [
    { id: 5, UserId: 2, type: 'CHEQUING', nickname: 'Everyday Chequing', accountNumber: '40121-00005', balance: 4200 },
    { id: 6, UserId: 2, type: 'SAVINGS', nickname: 'HISA', accountNumber: '40121-00006', balance: 1470 }
  ]

  beforeEach(async () => {
    service = { getAccounts: vi.fn().mockReturnValue(of(accounts)), getTransfers: vi.fn().mockReturnValue(of([])), createTransfer: vi.fn().mockReturnValue(of({ id: 1 })) }
    snackBar = { open: vi.fn() }
    await TestBed.configureTestingModule({
      imports: [AccountsComponent],
      providers: [{ provide: InvestmentService, useValue: service }, { provide: SnackBarHelperService, useValue: snackBar }]
    }).compileComponents()
    fixture = TestBed.createComponent(AccountsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should show owned accounts with masked numbers and their total', () => {
    expect(component.totalBalance).toBe(5670)
    expect(fixture.nativeElement.textContent).toContain('•••• 0005')
    expect(fixture.nativeElement.querySelectorAll('.account-card').length).toBe(2)
  })

  it('should send an email transfer and refresh the account data', () => {
    component.transferForm.patchValue({ recipientEmail: 'bender@portfolio-tracker.example', amount: 10, memo: 'Lunch' })
    component.submitTransfer()
    expect(service.createTransfer).toHaveBeenCalledWith({ fromAccountId: 5, recipientEmail: 'bender@portfolio-tracker.example', amount: 10, memo: 'Lunch' })
    expect(snackBar.open).toHaveBeenCalledWith('Transfer sent successfully.')
    expect(service.getAccounts).toHaveBeenCalledTimes(2)
  })

  it('should move money between owned accounts', () => {
    component.setDestinationMode('internal')
    component.transferForm.patchValue({ toAccountId: 6, amount: 25 })
    component.submitTransfer()
    expect(service.createTransfer).toHaveBeenCalledWith({ fromAccountId: 5, toAccountId: 6, amount: 25, memo: '' })
  })

  it('should not submit an invalid amount', () => {
    component.transferForm.patchValue({ recipientEmail: 'bender@portfolio-tracker.example', amount: 0 })
    component.submitTransfer()
    expect(service.createTransfer).not.toHaveBeenCalled()
  })

  it('should show API errors', () => {
    service.createTransfer.mockReturnValue(throwError(() => ({ error: { message: 'Insufficient funds.' } })))
    component.transferForm.patchValue({ recipientEmail: 'bender@portfolio-tracker.example', amount: 10 })
    component.submitTransfer()
    expect(component.errorMessage).toBe('Insufficient funds.')
    expect(component.submitting).toBe(false)
  })

  it('should handle empty accounts and transfer history', () => {
    service.getAccounts.mockReturnValue(of([]))
    component.ngOnInit()
    fixture.detectChanges()
    expect(component.totalBalance).toBe(0)
    expect(fixture.nativeElement.textContent).toContain('Your transfer history will appear here.')
  })
})
