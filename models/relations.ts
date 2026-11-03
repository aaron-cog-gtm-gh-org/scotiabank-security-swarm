import { type Sequelize } from 'sequelize'
import { AddressModel } from './address'
import { BankAccountModel } from './bankAccount'
import { BasketModel } from './basket'
import { BasketItemModel } from './basketitem'
import { ChallengeModel } from './challenge'
import { ChallengeDependencyModel } from './challengeDependency'
import { CardModel } from './card'
import { ComplaintModel } from './complaint'
import { FeedbackModel } from './feedback'
import { HintModel } from './hint'
import { ImageCaptchaModel } from './imageCaptcha'
import { MemoryModel } from './memory'
import { PrivacyRequestModel } from './privacyRequests'
import { ProductModel } from './product'
import { QuantityModel } from './quantity'
import { RecycleModel } from './recycle'
import { SecurityAnswerModel } from './securityAnswer'
import { SecurityQuestionModel } from './securityQuestion'
import { ScenePointsModel } from './scenePoints'
import { TransferModel } from './transfer'
import { UserModel } from './user'

import { WalletModel } from './wallet'
import { makeKeyNonUpdatable } from '../lib/noUpdate'

const relationsInit = (_sequelize: Sequelize) => {
  AddressModel.belongsTo(UserModel, {
    constraints: true,
    foreignKeyConstraint: true,
    foreignKey: {
      name: 'UserId'
    }
  })

  BankAccountModel.belongsTo(UserModel, {
    constraints: true,
    foreignKeyConstraint: true,
    foreignKey: { name: 'UserId' }
  })

  ScenePointsModel.belongsTo(UserModel, {
    constraints: true,
    foreignKeyConstraint: true,
    foreignKey: { name: 'UserId' }
  })

  TransferModel.belongsTo(BankAccountModel, { foreignKey: 'fromAccountId', as: 'fromAccount' })
  TransferModel.belongsTo(BankAccountModel, { foreignKey: 'toAccountId', as: 'toAccount' })

  BasketModel.belongsTo(UserModel, {
    constraints: true,
    foreignKeyConstraint: true,
    foreignKey: {
      name: 'UserId'
    }
  })
  BasketModel.belongsToMany(ProductModel, {
    through: BasketItemModel,
    as: 'Products',
    foreignKey: {
      name: 'BasketId'
    }
  })
  makeKeyNonUpdatable(BasketItemModel, 'BasketId')

  CardModel.belongsTo(UserModel, {
    constraints: true,
    foreignKeyConstraint: true,
    foreignKey: {
      name: 'UserId'
    }
  })

  ComplaintModel.belongsTo(UserModel, {
    constraints: true,
    foreignKeyConstraint: true,
    foreignKey: {
      name: 'UserId'
    }
  })

  FeedbackModel.belongsTo(UserModel, {
    foreignKey: {
      name: 'UserId'
    }
  }) // no FK constraint to allow anonymous feedback posts

  ImageCaptchaModel.belongsTo(UserModel, {
    foreignKey: {
      name: 'UserId'
    }
  })

  MemoryModel.belongsTo(UserModel, {
    constraints: true,
    foreignKeyConstraint: true,
    foreignKey: {
      name: 'UserId'
    }
  })

  PrivacyRequestModel.belongsTo(UserModel, {
    constraints: true,
    foreignKeyConstraint: true,
    foreignKey: {
      name: 'UserId'
    }
  })

  ProductModel.belongsToMany(BasketModel, {
    through: BasketItemModel,
    foreignKey: {
      name: 'ProductId'
    }
  })
  makeKeyNonUpdatable(BasketItemModel, 'ProductId')

  QuantityModel.belongsTo(ProductModel, {
    constraints: true,
    foreignKeyConstraint: true,
    foreignKey: {
      name: 'ProductId'
    }
  })

  RecycleModel.belongsTo(UserModel, {
    constraints: true,
    foreignKeyConstraint: true,
    foreignKey: {
      name: 'UserId'
    }
  })
  RecycleModel.belongsTo(AddressModel, {
    constraints: true,
    foreignKeyConstraint: true,
    foreignKey: {
      name: 'AddressId'
    }
  })

  SecurityAnswerModel.belongsTo(UserModel, {
    foreignKey: {
      name: 'UserId'
    }
  })
  SecurityAnswerModel.belongsTo(SecurityQuestionModel, {
    constraints: true,
    foreignKeyConstraint: true,
    foreignKey: {
      name: 'SecurityQuestionId'
    }
  })

  WalletModel.belongsTo(UserModel, {
    constraints: true,
    foreignKeyConstraint: true,
    foreignKey: {
      name: 'UserId'
    }
  })

  ChallengeModel.hasMany(ChallengeDependencyModel)
  ChallengeDependencyModel.belongsTo(ChallengeModel)

  ChallengeModel.hasMany(HintModel)
  HintModel.belongsTo(ChallengeModel)
}

export { relationsInit }
