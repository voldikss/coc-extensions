import Axios from 'axios'
import { config } from '../config'
const ProxyAgent = require('socks-proxy-agent')

const proxy = config.get<string>('proxy')
if (proxy) {
  const agent = new ProxyAgent(proxy)
  Axios.defaults.httpAgent = agent
  Axios.defaults.httpsAgent = agent
}

Axios.defaults.timeout = 3000

// https://github.com/axios/axios/issues/2968#issuecomment-820975852
import adapter from 'axios/lib/adapters/http'
export const HttpClient = Axios.create({ adapter })
