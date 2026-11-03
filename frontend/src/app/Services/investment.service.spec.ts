/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { InvestmentService } from './investment.service'

describe('InvestmentService', () => {
  let service: InvestmentService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] })
    service = TestBed.inject(InvestmentService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => httpMock.verify())

  it('should load accounts, including an empty account list', () => {
    let result
    service.getAccounts().subscribe(data => { result = data })
    const request = httpMock.expectOne('http://localhost:3000/rest/accounts')
    expect(request.request.method).toBe('GET')
    request.flush({ data: [] })
    expect(result).toEqual([])
  })

  it('should load transfer history', () => {
    let result
    service.getTransfers().subscribe(data => { result = data })
    const request = httpMock.expectOne('http://localhost:3000/rest/transfers')
    request.flush({ data: [{ id: 1 }] })
    expect(result).toEqual([{ id: 1 }])
  })

  it('should send a transfer', () => {
    const transfer = { fromAccountId: 5, recipientEmail: 'bender@portfolio-tracker.example', amount: 10 }
    service.createTransfer(transfer).subscribe()
    const request = httpMock.expectOne('http://localhost:3000/rest/transfers')
    expect(request.request.method).toBe('POST')
    expect(request.request.body).toEqual(transfer)
    request.flush({ data: { id: 1 } })
  })

  it('should load Scene+ points and rewards', () => {
    let result
    service.getScenePlus().subscribe(data => { result = data })
    const request = httpMock.expectOne('http://localhost:3000/rest/scene-plus')
    request.flush({ data: { points: 5000, rewards: [] } })
    expect(result).toEqual({ points: 5000, rewards: [] })
  })

  it('should redeem a reward', () => {
    service.redeemScenePlus(1, 2).subscribe()
    const request = httpMock.expectOne('http://localhost:3000/rest/scene-plus/redeem')
    expect(request.request.method).toBe('POST')
    expect(request.request.body).toEqual({ rewardId: 1, quantity: 2 })
    request.flush({ data: { points: 3000 } })
  })

  it('should preserve API errors', () => {
    let error
    service.getAccounts().subscribe({ error: err => { error = err } })
    httpMock.expectOne('http://localhost:3000/rest/accounts').flush({ message: 'Unavailable' }, { status: 500, statusText: 'Server Error' })
    expect(error.status).toBe(500)
    expect(error.error.message).toBe('Unavailable')
  })
})
