export type Bindings = {
    // bindings
    DB: D1Database
    KV: KVNamespace
    RATE_LIMITER: any

    // config
    PREFIX: string | undefined
    JWT_SECRET: string
    BLACK_LIST: string | undefined
    ENABLE_AUTO_REPLY: string | boolean | undefined
    ENABLE_WEBHOOK: string | boolean | undefined
    ENABLE_USER_CREATE_EMAIL: string | boolean | undefined
    ENABLE_USER_DELETE_EMAIL: string | boolean | undefined
    ENABLE_INDEX_ABOUT: string | boolean | undefined
    ADMIN_CONTACT: string | undefined
    COPYRIGHT: string | undefined

    // cf turnstile
    CF_TURNSTILE_SITE_KEY: string | undefined

    // telegram config
    TELEGRAM_BOT_TOKEN: string
    TG_MAX_ADDRESS: number | undefined
}

type JwtPayload = {
    address: string
    address_id: number
}

type UserPayload = {
    user_email: string
    user_id: number
    exp: number
    iat: number
}

type Variables = {
    userPayload: UserPayload,
    jwtPayload: JwtPayload
}
