import axios, { AxiosInstance } from 'axios'
import { prisma } from './prisma'

const TWITCH_API_BASE = 'https://api.twitch.tv/helix'
const TWITCH_AUTH_BASE = 'https://id.twitch.tv/oauth2'

export interface TwitchTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  scope: string[]
  token_type: string
}

export interface TwitchUser {
  id: string
  login: string
  display_name: string
  profile_image_url: string
}

export interface TwitchVod {
  id: string
  user_id: string
  user_login: string
  user_name: string
  title: string
  description: string
  created_at: string
  published_at: string
  url: string
  thumbnail_url: string
  viewable: string
  view_count: number
  language: string
  type: string
  duration: string
  game_name?: string
  game_id?: string
}

export interface TwitchChatMessage {
  user_id: string
  user_login: string
  user_name: string
  message_id: string
  content: string
  content_type: string
  sent_at: string
  fragments: Array<{
    type: string
    text: string
    emote?: {
      id: string
      name: string
      owner_id: string
      format: string
    }
    cheermote?: {
      prefix: string
      bits: number
      tier: number
    }
  }>
}

export interface TwitchVideoComment {
  content_id: string
  commenter: {
    user_id: string
    user_login: string
    user_name: string
  }
  message: {
    body: string
    fragments: TwitchChatMessage['fragments']
  }
  created_at: string
  content_offset_seconds: number
}

class TwitchApiClient {
  private client: AxiosInstance
  private accessToken: string | null = null
  private clientId: string

  constructor(accessToken?: string, clientId?: string) {
    this.clientId = clientId || process.env.TWITCH_CLIENT_ID!
    this.client = axios.create({
      baseURL: TWITCH_API_BASE,
      headers: {
        'Client-ID': this.clientId,
        'Authorization': `Bearer ${accessToken || ''}`,
      },
    })
    
    if (accessToken) {
      this.accessToken = accessToken
    }
  }

  setAccessToken(token: string) {
    this.accessToken = token
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  async refreshToken(refreshToken: string): Promise<TwitchTokenResponse> {
    const response = await axios.post(`${TWITCH_AUTH_BASE}/token`, null, {
      params: {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
      },
    })
    return response.data
  }

  async getUser(): Promise<TwitchUser> {
    const response = await this.client.get('/users')
    return response.data.data[0]
  }

  async getVods(userId: string, first = 20, after?: string): Promise<{ data: TwitchVod[], pagination?: { cursor: string } }> {
    const response = await this.client.get('/videos', {
      params: {
        user_id: userId,
        first,
        after,
        type: 'archive',
      },
    })
    return response.data
  }

  async getVod(vodId: string): Promise<TwitchVod | null> {
    const response = await this.client.get('/videos', {
      params: { id: vodId },
    })
    return response.data.data[0] || null
  }

  async getChatReplay(videoId: string, cursor?: string, first = 1000): Promise<{ data: TwitchVideoComment[], pagination?: { cursor: string } }> {
    const response = await this.client.get(`/videos/${videoId}/comments`, {
      params: {
        first,
        cursor,
      },
    })
    return response.data
  }

  async createClip(broadcasterId: string, hasDelay = false): Promise<{ id: string; edit_url: string }> {
    const response = await this.client.post('/clips', null, {
      params: {
        broadcaster_id: broadcasterId,
        has_delay: hasDelay,
      },
    })
    return response.data.data[0]
  }

  async getClip(clipId: string): Promise<any> {
    const response = await this.client.get('/clips', {
      params: { id: clipId },
    })
    return response.data.data[0]
  }

  async getStreamMarkers(userId: string, first = 100, after?: string): Promise<any> {
    const response = await this.client.get('/streams/markers', {
      params: {
        user_id: userId,
        first,
        after,
      },
    })
    return response.data
  }

  async validateToken(): Promise<{ client_id: string; login: string; scopes: string[]; user_id: string; expires_in: number }> {
    const response = await axios.get(`${TWITCH_AUTH_BASE}/validate`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    })
    return response.data
  }

  async revokeToken(): Promise<void> {
    await axios.post(`${TWITCH_AUTH_BASE}/revoke`, null, {
      params: {
        client_id: this.clientId,
        token: this.accessToken,
      },
    })
  }
}

export async function createTwitchClient(userId: string): Promise<TwitchApiClient> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Check if token is expired
  const now = new Date()
  if (user.tokenExpiresAt <= now) {
    // Refresh token
    const client = new TwitchApiClient()
    const tokens = await client.refreshToken(user.refreshToken)
    
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: expiresAt,
        scopes: tokens.scope.join(' '),
      },
    })

    return new TwitchApiClient(tokens.access_token)
  }

  return new TwitchApiClient(user.accessToken)
}

export function createTwitchClientWithToken(accessToken: string): TwitchApiClient {
  return new TwitchApiClient(accessToken)
}

export { TwitchApiClient }