/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { TestBed, type ComponentFixture } from '@angular/core/testing'
import { of, throwError } from 'rxjs'
import { ScenePlusComponent } from './scene-plus.component'
import { InvestmentService } from '../Services/investment.service'
import { SnackBarHelperService } from '../Services/snack-bar-helper.service'

describe('ScenePlusComponent', () => {
  let component: ScenePlusComponent
  let fixture: ComponentFixture<ScenePlusComponent>
  let service: any
  const reward = { id: 1, name: '$10 statement credit', points: 1000, value: 10 }

  beforeEach(async () => {
    service = { getScenePlus: vi.fn().mockReturnValue(of({ points: 5000, rewards: [reward] })), redeemScenePlus: vi.fn().mockReturnValue(of({ points: 4000, cost: 1000 })) }
    await TestBed.configureTestingModule({
      imports: [ScenePlusComponent],
      providers: [{ provide: InvestmentService, useValue: service }, { provide: SnackBarHelperService, useValue: { open: vi.fn() } }]
    }).compileComponents()
    fixture = TestBed.createComponent(ScenePlusComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should load points and rewards with a minimum quantity of one', () => {
    expect(component.points).toBe(5000)
    expect(component.rewards).toEqual([reward])
    expect(fixture.nativeElement.querySelector('input').getAttribute('min')).toBe('1')
    expect(fixture.nativeElement.querySelector('form').hasAttribute('novalidate')).toBe(false)
  })

  it('should redeem and show the new points balance', () => {
    component.redeem(reward)
    expect(service.redeemScenePlus).toHaveBeenCalledWith(1, 1)
    expect(component.points).toBe(4000)
    expect(component.resultMessage).toContain('Redeemed 1 × $10 statement credit')
  })

  it('should prevent invalid quantities in the UI', () => {
    component.quantities[1] = -1
    component.redeem(reward)
    expect(service.redeemScenePlus).not.toHaveBeenCalled()
  })

  it('should display redemption errors', () => {
    service.redeemScenePlus.mockReturnValue(throwError(() => ({ error: { message: 'Not enough Scene+ points.' } })))
    component.redeem(reward)
    expect(component.errorMessage).toBe('Not enough Scene+ points.')
  })

  it('should handle an empty catalogue', () => {
    service.getScenePlus.mockReturnValue(of({ points: 0, rewards: [] }))
    component.ngOnInit()
    fixture.detectChanges()
    expect(component.points).toBe(0)
    expect(fixture.nativeElement.querySelectorAll('.reward-card').length).toBe(0)
  })
})
