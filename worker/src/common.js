import { Jwt } from 'hono/utils/jwt'

import { getDomains, getStringValue } from './utils';

export const newAddress = async (c, name, domain, enablePrefix) => {
    // remove special characters
    name = name.replace(/[^a-zA-Z0-9.]/g, '')
    // check name length
    if (name.length < 0) {
        throw new Error("Name too short")
    }
    // create address
    if (enablePrefix) {
        name = getStringValue(c.env.PREFIX) + name;
    }
    if (name.length >= 30) {
        throw new Error("Name too long (max 30)")
    }
    // check domain, generate random domain
    const domains = getDomains(c);
    if (!domain || !domains.includes(domain)) {
        domain = domains[Math.floor(Math.random() * domains.length)];
    }
    // create address
    name = name + "@" + domain;
    try {
        const { success } = await c.env.DB.prepare(
            `INSERT INTO address(name) VALUES(?)`
        ).bind(name).run();
        if (!success) {
            throw new Error("Failed to create address")
        }
    } catch (e) {
        if (e.message && e.message.includes("UNIQUE")) {
            throw new Error("Address already exists")
        }
        throw new Error("Failed to create address")
    }
    let address_id = 0;
    address_id = await c.env.DB.prepare(
        `SELECT id FROM address where name = ?`
    ).bind(name).first("id");
    // create jwt
    const jwt = await Jwt.sign({
        address: name,
        address_id: address_id
    }, c.env.JWT_SECRET, "HS256")
    return {
        jwt: jwt,
        address: name,
    }
}

export const cleanup = async (c, cleanType, cleanDays) => {
    if (!cleanType || !cleanDays || cleanDays < 0 || cleanDays > 30) {
        throw new Error("Invalid cleanType or cleanDays")
    }
    console.log(`Cleanup ${cleanType} before ${cleanDays} days`);
    switch (cleanType) {
        case "mails":
            await c.env.DB.prepare(`
                DELETE FROM raw_mails WHERE created_at < datetime('now', '-${cleanDays} day')`
            ).run();
            break;
        case "mails_unknow":
            await c.env.DB.prepare(`
                DELETE FROM raw_mails WHERE address NOT IN
                (select name from address) AND created_at < datetime('now', '-${cleanDays} day')`
            ).run();
            break;
        case "sendbox":
            await c.env.DB.prepare(`
                DELETE FROM sendbox WHERE created_at < datetime('now', '-${cleanDays} day')`
            ).run();
            break;
        default:
            throw new Error("Invalid cleanType")
    }
    return true;
}

/**
 *
 * @param {*} c context
 * @param {*} query @type {string} query
 * @param {*} countQuery @type {string} countQuery
 * @param {*} limit @type {number} limit
 * @param {*} offset @type {number} offset
 * @returns {Promise} Promise
 */
export const handleListQuery = async (
    c, query, countQuery, params, limit, offset
) => {
    if (!limit || limit < 0 || limit > 100) {
        return c.text("Invalid limit", 400)
    }
    if (!offset || offset < 0) {
        return c.text("Invalid offset", 400)
    }
    const resultsQuery = `${query} order by id desc limit ? offset ?`;
    const { results } = await c.env.DB.prepare(resultsQuery).bind(
        ...params, limit, offset
    ).all();
    const count = offset == 0 ? await c.env.DB.prepare(
        countQuery
    ).bind(...params).first("count") : 0;
    return c.json({ results, count });
}
