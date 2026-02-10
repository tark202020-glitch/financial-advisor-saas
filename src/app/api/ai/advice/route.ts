import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Ensure API key is set
// Ensure API key is set
const apiKey = process.env.GOOGLE_AI_API_KEY;

export async function POST(req: Request) {
    if (!apiKey) {
        console.error("[AI Advice] Missing GOOGLE_AI_API_KEY");
        return NextResponse.json({
            advice: [{
                id: 1,
                category: "System",
                text: "API 키가 설정되지 않았어유. 관리자한테 말 좀 전해줘유."
            }]
        });
    }

    try {
        const body = await req.json();
        const { portfolio, totalValue } = body;

        // Safety check for data
        const safeTotalValue = isNaN(Number(totalValue)) ? 0 : Number(totalValue);
        const safePortfolio = Array.isArray(portfolio) ? portfolio.map(p => ({
            ...p,
            currentPrice: isNaN(Number(p.currentPrice)) ? 0 : Number(p.currentPrice),
            changeRate: isNaN(Number(p.changeRate)) ? 0 : Number(p.changeRate)
        })) : [];

        // Construct formatting instructions
        const prompt = `
        You are a friendly, playful stock investment expert who speaks in a heavy Chungcheong-do dialect (충청도 사투리).
        You are a close friend of the user.
        Your name is "구루 고래" (Guru Gorae).

        Analyze the user's portfolio and provide advice based on the following priorities:

        1. **Daily Review**: Comment on any significant changes from the previous day (if data is available/provided, otherwise skip or make a general comment).
        2. **Target Price Alert**: Identify stocks close to their target price (Limit). Advise on whether to sell based on market volatility. Emphasize not to miss the target.
        3. **Sector Balance**: Compare the user's sector allocation with current market trends/issues.
        4. **Overweight Warning**: Warn if any single stock exceeds 30% of the portfolio. Check if they are "watering down" (averaging down) too heavily.
        5. **Dividend Strategy**: Check dividend stock ratio. Remind about ex-dividend dates or amounts if applicable. Mention taxes/fees.
        6. **Long-term/Stagnant**: Mention stocks with no trade history for a long time but high market volatility.
        7. **Overseas Stocks**: specific advice for US stocks, mirroring domestic flow.
        8. **Action Item**: Propose a concrete action based on the analysis.

        **Tone**:
        - Use heavy Chungcheong-do dialect endings (e.g., ~겨?, ~유, ~혀, ~했슈).
        - Be witty and slightly teasing but genuinely helpful.
        - Example: "이 주식은 왜 안판겨? 무덤까지 가져갈려고?" (Why haven't you sold this stock? Gonna take it to the grave?)

        **Input Data**:
        Total Value: ${safeTotalValue}
        Portfolio: ${JSON.stringify(safePortfolio)}

        **Output Format**:
        Return a JSON object with the following structure:
        {
            "advice": [
                { "id": 1, "category": "Review", "text": "..." },
                { "id": 2, "category": "Target", "text": "..." },
                ...
            ]
        }
        Generate 3-4 most important pieces of advice from the list above, selecting the most relevant ones for this portfolio. Number 8 (Action Item) must always be included.
        Keep the text concise (1-2 sentences per item).
        `;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("[AI Advice] Gemini Response:", text); // Debug Log

        // Robust JSON Extraction
        let jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }

        let adviceData;
        try {
            adviceData = JSON.parse(jsonStr);
        } catch (parseError) {
            console.error("[AI Advice] JSON Parse Error:", parseError, "Raw Text:", text);
            // Return error as advice so user sees something
            return NextResponse.json({
                advice: [{
                    id: 1,
                    category: "Error",
                    text: "머리가 좀 아파서 계산이 잘 안되네유... (JSON Parse Error)"
                }]
            });
        }

        return NextResponse.json(adviceData);

    } catch (error: any) {
        console.error("[AI Advice] Internal Error:", error);
        return NextResponse.json({
            advice: [{
                id: 1,
                category: "Error",
                text: `서버 에러가 발생했슈: ${error.message || JSON.stringify(error)}`
            }]
        }); // Return 200 with error advice to prevent client crash
    }
}
