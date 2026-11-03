/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { DecimalPipe } from '@angular/common'
import { Component, ChangeDetectionStrategy, type OnInit, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatIconModule } from '@angular/material/icon'
import { InvestmentService, type SceneReward } from '../Services/investment.service'
import { SnackBarHelperService } from '../Services/snack-bar-helper.service'

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-scene-plus',
  templateUrl: './scene-plus.component.html',
  styleUrls: ['./scene-plus.component.scss'],
  imports: [DecimalPipe, FormsModule, MatButtonModule, MatCardModule, MatIconModule]
})
export class ScenePlusComponent implements OnInit {
  private readonly investmentService = inject(InvestmentService)
  private readonly snackBar = inject(SnackBarHelperService)

  points = 0
  rewards: SceneReward[] = []
  quantities: Record<number, number> = {}
  resultMessage = ''
  errorMessage = ''
  redeeming = 0

  ngOnInit (): void {
    this.loadRewards()
  }

  redeem (reward: SceneReward): void {
    const quantity = Number(this.quantities[reward.id] ?? 1)
    if (!Number.isInteger(quantity) || quantity < 1) return
    this.errorMessage = ''
    this.redeeming = reward.id
    this.investmentService.redeemScenePlus(reward.id, quantity).subscribe({
      next: (result) => {
        this.points = result.points
        this.resultMessage = `Redeemed ${quantity} × ${reward.name}. Your balance is ${this.points.toLocaleString()} Scene+ points.`
        this.snackBar.open('Reward redeemed successfully.')
        this.redeeming = 0
      },
      error: (err) => {
        this.errorMessage = err?.error?.message ?? err?.message ?? 'We could not redeem that reward.'
        this.redeeming = 0
      }
    })
  }

  private loadRewards (): void {
    this.investmentService.getScenePlus().subscribe({
      next: (scenePlus) => {
        this.points = scenePlus.points
        this.rewards = scenePlus.rewards
        for (const reward of this.rewards) this.quantities[reward.id] = 1
      },
      error: (err) => { this.errorMessage = err?.error?.message ?? err?.message ?? 'We could not load Scene+.' }
    })
  }
}
