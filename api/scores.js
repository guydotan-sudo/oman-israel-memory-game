import { kv } from '@vercel/kv';

export default async function handler(request, response) {
    try {
        if (request.method === 'GET') {
            // שליפת 10 השיאים הכי טובים
            const scores = await kv.zrange('oman_scores', 0, 9, { withScores: true });

            // המרת המבנה שחוזר מ-Redis למבנה שנוח לנו ב-JS
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
            const { name, apt, timeStr, timeSeconds } = request.body;

            const scoreData = JSON.stringify({ name, apt, timeStr });

            // שמירה ב-Redis (ZADD שומר לפי ה-score שזה זמן המשחק בשניות)
            await kv.zadd('oman_scores', { score: timeSeconds, member: scoreData });

            return response.status(200).json({ message: 'Score saved!' });
        }
    } catch (error) {
        return response.status(500).json({ error: error.message });
    }

    return response.status(405).end();
}
