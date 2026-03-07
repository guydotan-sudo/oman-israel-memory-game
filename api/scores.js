import Redis from 'ioredis';

// אתחול הקשר ל-Redis (שימוש במשתנה סביבה בורסל)
// אם אין משתנה סביבה, נשתמש בכתובת שסיפקת כברירת מחדל (אבל עדיף להגדיר בורסל)
const redisUrl = process.env.REDIS_URL || 'redis://default:VXS9hZEaViO02XgQ4AuEMffkQkJKfoXU@redis-16811.c265.us-east-1-2.ec2.cloud.redislabs.com:16811';
const redis = new Redis(redisUrl);

export default async function handler(request, response) {
    if (request.method === 'GET') {
        try {
            const { gameType = 'memory' } = request.query;
            const kvKey = `oman_scores_${gameType}`;

            // שליפת 100 השיאים הטובים ביותר (זמן נמוך יותר = מקום גבוה יותר)
            const scores = await redis.zrange(kvKey, 0, 99, 'WITHSCORES');

            const formattedScores = [];
            for (let i = 0; i < scores.length; i += 2) {
                try {
                    const data = JSON.parse(scores[i]);
                    formattedScores.push({
                        name: data.name,
                        apt: data.apt,
                        timeStr: data.timeStr,
                        timeSeconds: parseFloat(scores[i + 1])
                    });
                } catch (e) { continue; }
            }

            return response.status(200).json(formattedScores);
        } catch (error) {
            console.error('Redis GET Error:', error);
            return response.status(500).json({ error: "Failed to fetch scores", detail: error.message });
        }
    }

    if (request.method === 'POST') {
        try {
            let body = request.body;
            if (typeof body === 'string') {
                try { body = JSON.parse(body); } catch (e) { }
            }

            const { name, apt, timeStr, timeSeconds, game = 'memory' } = body;

            if (!name || !apt) {
                return response.status(400).json({ error: "Missing player details" });
            }

            const targetKey = `oman_scores_${game}`;
            const scoreData = JSON.stringify({
                name,
                apt,
                timeStr,
                uid: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            });

            // הוספה ל-Sorted Set (ZADD)
            await redis.zadd(targetKey, timeSeconds, scoreData);

            return response.status(200).json({ message: 'Score saved!' });
        } catch (error) {
            console.error('Redis POST Error:', error);
            return response.status(500).json({ error: "Failed to save score", detail: error.message });
        }
    }

    return response.status(405).end();
}
