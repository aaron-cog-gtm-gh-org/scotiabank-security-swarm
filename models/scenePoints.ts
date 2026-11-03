/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import {
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  DataTypes,
  type CreationOptional,
  type Sequelize
} from 'sequelize'

class ScenePoints extends Model<
InferAttributes<ScenePoints>,
InferCreationAttributes<ScenePoints>
> {
  declare id: CreationOptional<number>
  declare UserId: number
  declare points: CreationOptional<number>
}

const ScenePointsModelInit = (sequelize: Sequelize) => {
  ScenePoints.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      UserId: DataTypes.INTEGER,
      points: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      }
    },
    {
      tableName: 'ScenePoints',
      sequelize
    }
  )
}

export { ScenePoints as ScenePointsModel, ScenePointsModelInit }
