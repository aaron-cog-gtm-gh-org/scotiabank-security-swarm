/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { describe, it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { servePublicFiles, isPublicFtpFile } from '../../routes/fileServer'

void describe('fileServer', () => {
  let req: any
  let res: any
  let next: any

  beforeEach(() => {
    res = { sendFile: mock.fn(), status: mock.fn() }
    req = { params: {}, query: {} }
    next = mock.fn()
  })

  function assertBlocked () {
    assert.equal(res.sendFile.mock.calls.length, 0)
    assert.equal(res.status.mock.calls[0].arguments[0], 403)
    assert.equal(next.mock.calls.length, 1)
    assert.ok(next.mock.calls[0].arguments[0] instanceof Error)
  }

  void it('should serve public files from folder /ftp', () => {
    req.params.file = 'legal.md'

    servePublicFiles()(req, res, next)

    assert.equal(res.sendFile.mock.calls.length, 1)
    assert.match(res.sendFile.mock.calls[0].arguments[0], /ftp[/\\]legal\.md$/)
  })

  for (const file of ['acquisitions.md', 'incident-support.kdbx', 'order_abcd-0123456789abcdef.pdf', 'test.pdf', 'test.md', 'nice.try']) {
    void it(`should not serve non-public file ${file}`, () => {
      req.params.file = file

      servePublicFiles()(req, res, next)

      assertBlocked()
    })
  }

  for (const file of ['package.json.bak%00.md', 'eastere.gg%00.pdf', 'coupons_2013.md.bak%00.md', 'legal.md%00.md', 'package.json.bak\0.md', 'package.json.bak%00']) {
    void it(`should reject poison null byte in ${JSON.stringify(file)}`, () => {
      req.params.file = file

      servePublicFiles()(req, res, next)

      assertBlocked()
      assert.match(next.mock.calls[0].arguments[0].message, /null bytes/)
    })
  }

  for (const file of ['../../../../nice.try', '..\\legal.md']) {
    void it(`should raise error for slashes in filename ${file}`, () => {
      req.params.file = file

      servePublicFiles()(req, res, next)

      assertBlocked()
    })
  }

  void it('should only treat explicitly listed files as public', () => {
    assert.equal(isPublicFtpFile('legal.md'), true)
    assert.equal(isPublicFtpFile('acquisitions.md'), false)
    assert.equal(isPublicFtpFile('quarantine'), false)
  })
})
