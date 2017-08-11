import {
  MongoClient, ObjectID
} from 'mongodb'

import { log } from './scripts/util'

const mongoUrl = 'mongodb://localhost:27017'

export default class Database {
  static async initialize (isTest = false) {
    log('Connecting to database')
    this.db = await MongoClient.connect(mongoUrl)
    log('Connected')

    if (isTest) {
      try {
        await this.db.collection('coursesTest').drop()
      } catch (err) {}
      try {
        await this.db.collection('accountsTest').drop()
      } catch (err) {}
      this.courses = this.db.collection('coursesTest')
      this.accounts = this.db.collection('accountsTest')
      this.stars = this.db.collection('starsTest')
    } else {
      this.courses = this.db.collection('courses')
      this.accounts = this.db.collection('accounts')
      this.stars = this.db.collection('stars')
    }
  }

  static addCourse (course) {
    return this.courses.insertOne(course)
  }

  static updateCourse (id, course) {
    return this.courses.updateOne({ '_id': ObjectID(id) }, { $set: course })
  }

  static filterCourses (filter, sort = { lastmodified: -1 }, skip = 0, limit = 100) {
    return this.courses.find(filter).sort(sort).skip(skip).limit(limit)
  }

  static deleteCourse (id) {
    return this.courses.removeOne({ '_id': ObjectID(id) })
  }

  static async starCourse (courseId, accountId) {
    await this.stars.insertOne({ courseId, accountId })
    const stars = (await this.stars.find({ courseId: ObjectID(courseId) }).toArray()).length
    return this.courses.updateOne({ '_id': ObjectID(courseId) }, { $set: { stars } })
  }

  static async unstarCourse (courseId, accountId) {
    await this.stars.removeOne({ courseId: ObjectID(courseId), accountId: ObjectID(accountId) })
    const stars = (await this.stars.find({ courseId: ObjectID(courseId) }).toArray()).length
    return this.courses.updateOne({ '_id': ObjectID(courseId) }, { $set: { stars } })
  }

  static getAccountStars (accountId) {
    return this.stars.find({ accountId: ObjectID(accountId) }).toArray()
  }

  static async isCourseStarred (courseId, accountId) {
    const length = (await this.stars.find({ courseId: ObjectID(courseId), accountId: ObjectID(accountId) }).toArray()).length
    return length === 1
  }

  static async getCoursesCount () {
    return (await this.courses.stats()).count
  }

  static addAccount (account) {
    return this.accounts.insertOne(account)
  }

  static updateAccount (id, account) {
    return this.accounts.updateOne({ '_id': ObjectID(id) }, { $set: account })
  }

  static filterAccounts (filter) {
    return this.accounts.find(filter)
  }

  static async getAccountsCount () {
    return (await this.accounts.stats()).count
  }
}
