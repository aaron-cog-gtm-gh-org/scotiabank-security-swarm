/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import path from 'node:path'
import { type Request, type Response, type NextFunction } from 'express'

export const publicFtpFiles: readonly string[] = ['legal.md']

export const isPublicFtpFile = (file: string) => publicFtpFiles.includes(file)

export function servePublicFiles () {
  return ({ params }: Request, res: Response, next: NextFunction) => {
    const file = params.file

    if (!file || file.includes('\0') || file.toLowerCase().includes('%00')) {
      res.status(403)
      next(new Error('File names cannot contain null bytes!'))
    } else if (file.includes('/') || file.includes('\\')) {
      res.status(403)
      next(new Error('File names cannot contain slashes!'))
    } else if (isPublicFtpFile(file)) {
      res.sendFile(path.resolve('ftp/', file))
    } else {
      res.status(403)
      next(new Error('Only public files can be downloaded!'))
    }
  }
}
