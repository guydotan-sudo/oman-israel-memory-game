import { kv } from '@vercel/kv';

export default async function handler(request, response) {
    try {
        const { gameType = 'memory' } = request.query;
        const kvKey = `oman_scores_${gameType}`;

        if (request.method === 'GET') {
            const scores = await kv.zrange(kvKey, 0, 9, { withScores: true });

            const formattedScores = [];
            for (let i = 0; i < scores.length; i += 2) {
                const data = JSON.parse(scores[i]);
                formattedScores.push({
                    name: data.name,
                    apt: data.apt,
                    timeStr: data.timeStr,
                    timeSeconds: scores[i + 1]
                });
            }

            return response.status(200).json(formattedScores);
        }

        if (request.method === 'POST') {
            const { name, apt, timeStr, timeSeconds, game = 'memory' } = request.body;
            const targetKey = `oman_scores_${game}`;

            // אנחנו מוסיפים מזהה ייחודי (זמן + מספר רנדומלי) כדי שגם אם אותו משתמש שיחק פעמיים, 
            // זה יירשם כשתי תוצאות שונות ב-Redis (שבו הערך חייב להיות ייחודי)
            const scoreData = JSON.stringify({
                name,
                apt,
                timeStr,
                uid: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            });

            await kv.zadd(targetKey, { score: timeSeconds, member: scoreData });

            return response.status(200).json({ message: 'Score saved!' });
        }
    } catch (error) {
        return response.status(500).json({ error: error.message });
    }

    return response.status(405).end();
}
