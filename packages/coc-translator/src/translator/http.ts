// related: https://github.com/axios/axios/issues/2968#issuecomment-820975852
import adapter from 'adapter'
import Axios, { AxiosRequestConfig } from 'axios'
import { HttpProxyAgent } from 'http-proxy-agent'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { SocksProxyAgent } from 'socks-proxy-agent'
import * as url from 'url'

import { config } from '../config'

const ProxyAgentMap = {
  'http:': HttpProxyAgent,
  'https:': HttpsProxyAgent,
  'socks:': SocksProxyAgent,
}

function isProxyAgentProtocal(protocol: string): protocol is keyof typeof ProxyAgentMap {
  return protocol in ProxyAgentMap
}

const params: AxiosRequestConfig = {
  adapter,
  timeout: 5000,
}

let proxy = config.get<string>('proxy')
if (proxy) {
  proxy = proxy.replace('localhost', '127.0.0.1')
  const protocol = url.parse(proxy).protocol
  if (protocol && isProxyAgentProtocal(protocol)) {
    const agent = new ProxyAgentMap[protocol](proxy)
    params.httpAgent = agent
    params.httpsAgent = agent
  } else {
    throw new Error(`Not supported protocol: ${proxy}`)
  }
}

export const HttpClient = Axios.create(params)
