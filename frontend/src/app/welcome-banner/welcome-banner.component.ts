/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { Component, type OnInit, inject, ChangeDetectionStrategy } from '@angular/core'
import { ConfigurationService } from '../Services/configuration.service'
import { MatDialogRef } from '@angular/material/dialog'
import { CookieService } from 'ngy-cookie'
import { TranslateModule } from '@ngx-translate/core'

import { MatIconModule } from '@angular/material/icon'
import { MatTooltip } from '@angular/material/tooltip'
import { MatButtonModule } from '@angular/material/button'

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-welcome-banner',
  templateUrl: 'welcome-banner.component.html',
  styleUrls: ['./welcome-banner.component.scss'],
  imports: [MatButtonModule, MatTooltip, MatIconModule, TranslateModule]
})
export class WelcomeBannerComponent implements OnInit {
  dialogRef = inject<MatDialogRef<WelcomeBannerComponent>>(MatDialogRef)
  private readonly configurationService = inject(ConfigurationService)
  private readonly cookieService = inject(CookieService)

  public title = 'Welcome to your Portfolio Overview'
  public message = "<p>Track your combined balance, asset mix and holdings across your <strong>RRSP</strong>, <strong>TFSA</strong> and <strong>Cash</strong> accounts, then build a <strong>Trade Ticket</strong> to place your next order.</p><p><em>Demo interface with mock data. Not affiliated with The Bank of Nova Scotia. Balances, quotes and holdings shown in this application are fictional and must not be used for investment decisions.</em></p>"
  public showHackingInstructor = true
  public showDismissBtn = true

  private readonly welcomeBannerStatusCookieKey = 'welcomebanner_status'

  ngOnInit (): void {
    this.configurationService.getApplicationConfiguration().subscribe({
      next: (config) => {
        if (config?.application?.welcomeBanner) {
          this.title = config.application.welcomeBanner.title
          this.message = config.application.welcomeBanner.message
        }
        this.showHackingInstructor = config?.hackingInstructor?.isEnabled
        // Don't allow to skip the tutorials when restrictToTutorialsFirst and showHackingInstructor are enabled
        if (this.showHackingInstructor && config?.challenges?.restrictToTutorialsFirst) {
          this.dialogRef.disableClose = true
          this.showDismissBtn = false
        }
      },
      error: (err) => { console.log(err) }
    })
  }

  startHackingInstructor () {
    this.closeWelcome()
    console.log('Starting instructions for challenge "Score Board"')
    this.launchHackingInstructor('Score Board')
  }

  protected launchHackingInstructor (challengeName: string) {
    import('../../hacking-instructor').then(module => {
      module.startHackingInstructorFor(challengeName)
    })
  }

  closeWelcome (): void {
    this.dialogRef.close()
    const expires = new Date()
    expires.setFullYear(expires.getFullYear() + 1)
    this.cookieService.put(this.welcomeBannerStatusCookieKey, 'dismiss', { expires })
  }
}
