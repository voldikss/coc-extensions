import Axios, { AxiosRequestConfig } from 'axios'
// https://github.com/axios/axios/issues/2968#issuecomment-820975852
// @ts-ignore
import * as adapter from 'axios/lib/adapters/http'
import { SocksProxyAgent } from 'socks-proxy-agent'

import { config } from '../config'

const params: AxiosRequestConfig = {
  adapter,
  timeout: 3000,
}

const proxy = config.get<string>('proxy')
if (proxy) {
  const agent = new SocksProxyAgent(proxy)
  params.httpAgent = agent
  params.httpsAgent = agent
}

export const HttpClient = Axios.create(params)
