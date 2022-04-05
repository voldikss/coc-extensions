import Axios, { AxiosRequestConfig } from 'axios'
import { config } from '../config'

// https://github.com/axios/axios/issues/2968#issuecomment-820975852
import * as adapter from 'axios/lib/adapters/http'

const params: AxiosRequestConfig = {
  adapter,
  timeout: 3000,
}

const proxy = config.get<string>('proxy')
if (proxy) {
  const ProxyAgent = require('socks-proxy-agent')
  const agent = new ProxyAgent(proxy)
  params.httpAgent = agent
  params.httpsAgent = agent
}

export const HttpClient = Axios.create(params)
