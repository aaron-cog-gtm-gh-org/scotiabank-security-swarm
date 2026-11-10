/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import path from 'node:path'
import { type Request, type Response, type NextFunction } from 'express'

import { ordersCollection } from '../data/mongodb'
import * as security from '../lib/insecurity'
import { orderConfirmationsFolder } from './order'

export function orderHistory () {
  return async (req: Request, res: Response, next: NextFunction) => {
    const loggedInUser = security.authenticatedUsers.get(req.headers?.authorization?.replace('Bearer ', ''))
    if (loggedInUser?.data?.email && loggedInUser.data.id) {
      const email = loggedInUser.data.email
      const customerToken = security.customerToken(email, loggedInUser.data.username)
      const order = await ordersCollection.find({ customerToken })
      res.status(200).json({ status: 'success', data: order })
    } else {
      next(new Error('Blocked illegal activity by ' + req.socket.remoteAddress))
    }
  }
}

export function orderConfirmation () {
  return async (req: Request, res: Response, next: NextFunction) => {
    const loggedInUser = security.authenticatedUsers.get(req.headers?.authorization?.replace('Bearer ', ''))
    if (!loggedInUser?.data?.email) {
      res.status(401).json({ status: 'error', message: 'Unauthorized' })
      return
    }
    const orderId = req.params.id
    if (typeof orderId !== 'string' || !/^[0-9a-f]{4}-[0-9a-f]{16}$/.test(orderId)) {
      res.status(404).json({ status: 'error', message: 'Order not found' })
      return
    }
    const order = await ordersCollection.findOne({ orderId })
    const customerToken = security.customerToken(loggedInUser.data.email, loggedInUser.data.username)
    if (!order?.customerToken || order.customerToken !== customerToken) {
      res.status(404).json({ status: 'error', message: 'Order not found' })
      return
    }
    res.sendFile(path.join(orderConfirmationsFolder, `order_${orderId}.pdf`), (err) => {
      if (err) next(err)
    })
  }
}

export function allOrders () {
  return async (req: Request, res: Response, next: NextFunction) => {
    const order = await ordersCollection.find()
    res.status(200).json({ status: 'success', data: order.reverse() })
  }
}

export function toggleDeliveryStatus () {
  return async (req: Request, res: Response, next: NextFunction) => {
    const deliveryStatus = !req.body.deliveryStatus
    const eta = deliveryStatus ? '0' : '1'
    await ordersCollection.update({ _id: req.params.id }, { $set: { delivered: deliveryStatus, eta } })
    res.status(200).json({ status: 'success' })
  }
}
