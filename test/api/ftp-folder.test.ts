/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import type { Express } from 'express'
import { createTestApp } from './helpers/setup'

let app: Express

before(async () => {
  const result = await createTestApp()
  app = result.app
}, { timeout: 60000 })

function responseText (res: request.Response): string {
  return res.text ?? (Buffer.isBuffer(res.body) ? res.body.toString('utf-8') : '')
}

void describe('/ftp', () => {
  void it('GET serves a directory listing that only contains public files', async () => {
    const res = await request(app)
      .get('/ftp')
    assert.equal(res.status, 200)
    assert.ok(res.headers['content-type']?.includes('text/html'))
    assert.ok(res.text.includes('<title>listing directory /ftp</title>'))
    for (const hidden of ['acquisitions.md', 'package.json.bak', 'coupons_2013.md.bak', 'incident-support.kdbx', 'eastere.gg', 'suspicious_errors.yml', 'order_']) {
      assert.ok(!res.text.includes(hidden), `listing should not contain ${hidden}`)
    }
  })

  for (const file of ['doesnotexist.md', 'doesnotexist.pdf', 'doesnotexist.exe', 'eastere.gg', 'coupons_2013.md.bak', 'package.json.bak', 'suspicious_errors.yml', 'acquisitions.md', 'incident-support.kdbx', 'announcement_encrypted.md', 'order_0000-0000000000000000.pdf']) {
    void it(`GET non-public file /ftp/${file} returns a 403 error`, async () => {
      const res = await request(app)
        .get('/ftp/' + file)
      assert.equal(res.status, 403)
    })
  }

  for (const file of ['eastere.gg', 'suspicious_errors.yml', 'coupons_2013.md.bak', 'package.json.bak', 'encrypt.pyc', 'legal.md']) {
    for (const suffix of ['.md', '.pdf']) {
      void it(`GET /ftp/${file}%2500${suffix} with Poison Null Byte attack returns a 403 error`, async () => {
        const res = await request(app)
          .get(`/ftp/${file}%2500${suffix}`)
          .buffer(true)
        assert.equal(res.status, 403)
        assert.ok(responseText(res).includes('File names cannot contain null bytes!'))
      })
    }
  }

  void it('GET a file name containing a raw null byte returns a 403 error', async () => {
    const res = await request(app)
      .get('/ftp/package.json.bak%00.md')
    assert.ok([400, 403].includes(res.status))
  })

  void it('GET a restricted file directly from file system path on server by tricking route definitions fails with 403 error', async () => {
    const res = await request(app)
      .get('/ftp///eastere.gg')
    assert.equal(res.status, 403)
  })

  void it('GET a restricted file directly from file system path on server by appending URL parameter fails with 403 error', async () => {
    const res = await request(app)
      .get('/ftp/eastere.gg?.md')
    assert.equal(res.status, 403)
  })

  void it('GET a file whose name contains a "/" fails with a 403 error', async () => {
    const res = await request(app)
      .get('/ftp/%2fetc%2fos-release')
    assert.equal(res.status, 403)
    assert.ok(res.text.includes('Error: File names cannot contain slashes!'))
  })

  void it('GET an accessible file directly from file system path on server', async () => {
    const res = await request(app)
      .get('/ftp/legal.md')
    assert.equal(res.status, 200)
    assert.ok(res.text.includes('# Legal Information'))
  })

  void it('GET file /ftp/quarantine/juicy_malware_linux_amd_64.url', async () => {
    const res = await request(app)
      .get('/ftp/quarantine/juicy_malware_linux_amd_64.url')
    assert.equal(res.status, 200)
  })

  void it('GET file /ftp/quarantine/juicy_malware_linux_arm_64.url', async () => {
    const res = await request(app)
      .get('/ftp/quarantine/juicy_malware_linux_arm_64.url')
    assert.equal(res.status, 200)
  })

  void it('GET existing file /ftp/quarantine/juicy_malware_macos_64.url', async () => {
    const res = await request(app)
      .get('/ftp/quarantine/juicy_malware_macos_64.url')
    assert.equal(res.status, 200)
  })

  void it('GET existing file /ftp/quarantine/juicy_malware_windows_64.exe.url', async () => {
    const res = await request(app)
      .get('/ftp/quarantine/juicy_malware_windows_64.exe.url')
    assert.equal(res.status, 200)
  })
})
