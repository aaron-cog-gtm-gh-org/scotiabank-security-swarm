/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { Component, ChangeDetectionStrategy } from '@angular/core'
import { DecimalPipe } from '@angular/common'

interface AssetSlice {
  label: string
  percentage: number
  color: string
  dashArray: string
  dashOffset: string
}

const CIRCUMFERENCE = 2 * Math.PI * 70

const ALLOCATION: Omit<AssetSlice, 'dashArray' | 'dashOffset'>[] = [
  { label: 'Equities', percentage: 46, color: '#ec111a' },
  { label: 'Fixed income', percentage: 27, color: '#3b0a0a' },
  { label: 'GICs & cash', percentage: 18, color: '#f5f6fa' },
  { label: 'Alternatives', percentage: 9, color: '#595959' }
]

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-portfolio-overview',
  templateUrl: './portfolio-overview.component.html',
  styleUrls: ['./portfolio-overview.component.scss'],
  imports: [DecimalPipe]
})
export class PortfolioOverviewComponent {
  readonly combinedBalance = 487_312.58
  readonly bookCost = 421_904.12
  readonly dayChange = 1842.37
  readonly dayChangePercentage = 0.38
  readonly buyingPower = 24_186.9
  readonly asOf = 'as of 4:00 PM ET'

  readonly assetMix: AssetSlice[] = this.buildAssetMix()

  get unrealizedGain (): number {
    return this.combinedBalance - this.bookCost
  }

  get unrealizedGainPercentage (): number {
    return (this.unrealizedGain / this.bookCost) * 100
  }

  private buildAssetMix (): AssetSlice[] {
    let consumed = 0
    return ALLOCATION.map((slice) => {
      const length = (slice.percentage / 100) * CIRCUMFERENCE
      const asset = {
        ...slice,
        dashArray: `${length} ${CIRCUMFERENCE - length}`,
        dashOffset: `${-consumed}`
      }
      consumed += length
      return asset
    })
  }
}
