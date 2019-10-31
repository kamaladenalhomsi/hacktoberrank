const express = require('express')
const redisClient = require('../../redis')

const PullRequestController = express()

PullRequestController.get('/:year?', async function (req, res) {
  const year = req.params.year || (new Date()).getFullYear()
  let { page, limit } = req.query
  page = Number(page)
  limit = Number(limit)
  try {
    const users = await redisClient.zrevrange(`users:${year}`, page - 1, page * (limit + 2))
    const promises = []
    const arrOfObjects = []

    const nonBotUsers = users.filter((user) => {
      return !user.endsWith('[bot]')
    })

    for (let i = 0; i < nonBotUsers.length; i++) {
      promises[i] = redisClient.smembers(`pull-requests:${year}:${nonBotUsers[i]}`)
    }

    const result = await Promise.all(promises)
    for (let i = 0; i < nonBotUsers.length; i++) {
      arrOfObjects.push({
        username: nonBotUsers[i],
        pullRequests: result[i]
      })
    }
    res.json(arrOfObjects)
  } catch (error) {
    res.status(400).send(error)
  }
})

module.exports = PullRequestController
