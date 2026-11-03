/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { type ComponentFixture, TestBed } from '@angular/core/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { AccountsPanelComponent } from './accounts-panel.component'
import { InvestmentService } from '../Services/investment.service'
import { of } from 'rxjs'

describe('AccountsPanelComponent', () => {
  let component: AccountsPanelComponent
  let fixture: ComponentFixture<AccountsPanelComponent>

  beforeEach(async () => {
    localStorage.removeItem('token')
    await TestBed.configureTestingModule({
      imports: [AccountsPanelComponent, RouterTestingModule],
      providers: [{ provide: InvestmentService, useValue: { getAccounts: vi.fn().mockReturnValue(of([])) } }]
    }).compileComponents()

    fixture = TestBed.createComponent(AccountsPanelComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => localStorage.removeItem('token'))

  it('should load real accounts when logged in', () => {
    localStorage.setItem('token', 'token')
    const service = TestBed.inject(InvestmentService)
    vi.mocked(service.getAccounts).mockReturnValue(of([{ id: 5, UserId: 2, type: 'CHEQUING', nickname: 'Everyday Chequing', accountNumber: '40121-00005', balance: 4200 }]))
    component.ngOnInit()
    expect(component.accounts).toEqual([{ name: 'Everyday Chequing', number: '•••• 0005', balance: 4200 }])
    expect(component.totalBalance).toBe(4200)
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should total the mock account balances', () => {
    const expected = component.accounts.reduce((sum, account) => sum + account.balance, 0)
    expect(component.totalBalance).toBeCloseTo(expected, 2)
  })

  it('should render a row per account', () => {
    const rows = fixture.nativeElement.querySelectorAll('.account')
    expect(rows.length).toBe(component.accounts.length)
  })

  it('should link the primary action to the existing basket route', () => {
    const primary = fixture.nativeElement.querySelector('.action.primary')
    expect(primary.getAttribute('href')).toBe('/basket')
  })
})
