import { kv } from '@vercel/kv';

export default async function handler(request, response) {
    if (request.method === 'GET') {
        try {
            const { gameType = 'memory' } = request.query;
            const kvKey = `oman_scores_${gameType}`;

            // Fetch top 100 scores from Redis (sorted set)
            const scores = await kv.zrange(kvKey, 0, 99, { withScores: true });

            const formattedScores = [];
            for (let i = 0; i < scores.length; i += 2) {
                try {
                    const data = typeof scores[i] === 'string' ? JSON.parse(scores[i]) : scores[i];
                    formattedScores.push({
                        name: data.name,
                        apt: data.apt,
                        timeStr: data.timeStr,
                        timeSeconds: scores[i + 1]
                    });
                } catch (e) { continue; }
            }

            return response.status(200).json(formattedScores);
        } catch (error) {
            console.error('KV GET Error:', error);
            return response.status(500).json({ error: "Storage error. Check Vercel KV connection.", detail: error.message });
        }
    }

    if (request.method === 'POST') {
        try {
            // Manual body parsing for Node.js serverless functions if needed
            let body = request.body;
            if (typeof body === 'string') {
                try { body = JSON.parse(body); } catch (e) { }
            }

            const { name, apt, timeStr, timeSeconds, game = 'memory' } = body;

            if (!name || !apt) {
                return response.status(400).json({ error: "Missing player name or apartment." });
            }

            const targetKey = `oman_scores_${game}`;
            const scoreData = JSON.stringify({
                name,
                apt,
                timeStr,
                uid: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            });

            // Add to Redis ZSET
            await kv.zadd(targetKey, { score: timeSeconds, member: scoreData });

            return response.status(200).json({ message: 'Score saved!' });
        } catch (error) {
            console.error('KV POST Error:', error);
            return response.status(500).json({ error: "Save error. Check Vercel KV connection.", detail: error.message });
        }
    }

    return response.status(405).end();
}
