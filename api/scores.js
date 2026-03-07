import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://default:VXS9hZEaViO02XgQ4AuEMffkQkJKfoXU@redis-16811.c265.us-east-1-2.ec2.cloud.redislabs.com:16811';
const redis = new Redis(redisUrl);

export default async function handler(request, response) {
    if (request.method === 'GET') {
        try {
            const { gameType = 'memory' } = request.query;
            const kvKey = `oman_scores_${gameType}`;

            // Fetch top 100 scores (sorted by score ASC, where score = timeSeconds)
            const rawScores = await redis.zrange(kvKey, 0, 99, 'WITHSCORES');

            const formatted = [];
            for (let i = 0; i < rawScores.length; i += 2) {
                try {
                    const data = JSON.parse(rawScores[i]);
                    formatted.push({
                        name: data.name,
                        apt: data.apt,
                        timeStr: data.timeStr,
                        timeSeconds: parseFloat(rawScores[i + 1])
                    });
                } catch (e) { continue; }
            }

            return response.status(200).json(formatted);
        } catch (error) {
            console.error('Redis GET Error:', error);
            return response.status(500).json({ error: "Failed to fetch scores." });
        }
    }

    if (request.method === 'POST') {
        try {
            let body = request.body;
            if (typeof body === 'string') {
                try { body = JSON.parse(body); } catch (e) {
                    return response.status(400).json({ error: "Invalid JSON body string." });
                }
            }

            const { name, apt, timeStr, timeSeconds, game = 'memory' } = body;

            if (!name || !apt || typeof timeSeconds === 'undefined') {
                return response.status(400).json({ error: "Missing required fields (name, apt, timeSeconds)." });
            }

            const targetKey = `oman_scores_${game}`;
            const scoreData = JSON.stringify({
                name,
                apt,
                timeStr,
                uid: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            });

            // Redis ZADD: key score member
            await redis.zadd(targetKey, timeSeconds, scoreData);

            return response.status(200).json({ message: 'Score saved!' });
        } catch (error) {
            console.error('Redis POST Error:', error);
            return response.status(500).json({ error: "Failed to save score." });
        }
    }

    return response.status(405).end();
}
