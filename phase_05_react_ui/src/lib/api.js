import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  timeout: 30_000,
})

export async function predictAll(text) {
  const { data } = await client.post('/predict', { text })
  return data
}

export async function getMetrics() {
  const { data } = await client.get('/metrics')
  return data
}

export async function getHistory() {
  const { data } = await client.get('/history')
  return data
}

export async function healthCheck() {
  const { data } = await client.get('/health')
  return data
}

export async function predictBatch(texts, models = ['all']) {
  const { data } = await client.post('/predict/batch', { texts, models })
  return data
}

export async function getAccuracyScaling() {
  const { data } = await client.get('/accuracy-scaling')
  return data
}

export async function getLiveEval(n = 10, hashtag = '', bearerToken = '') {
  const params = { n }
  if (hashtag) params.hashtag = hashtag
  const headers = {}
  const token = bearerToken.trim().replace(/^Bearer\s+/i, '')
  if (token) {
    headers.Authorization = `Bearer ${token}`
    headers['X-Twitter-Bearer-Token'] = token
  }
  const { data } = await client.get('/live-eval', { params, headers })
  return data
}
