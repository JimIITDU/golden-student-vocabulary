export async function handler(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' };
    }

    const { classLabel, title } = JSON.parse(event.body);
    const prompt = `Write a short 1-2 sentence book description in Bengali for a vocabulary book called "${title || 'Golden Student Voc@bulary'}" for ${classLabel} students in Bangladesh. It covers word meanings, synonyms, antonyms, and parts of speech from the national board textbook. Return only the description text, nothing else.`;

    const response = await fetch('https://api-inference.huggingface.co/models/google/gemma-2-2b-it', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.HF_TOKEN}`
        },
        body: JSON.stringify({
            inputs: prompt,
            parameters: { max_new_tokens: 150, temperature: 0.7, return_full_text: false }
        })
    });

    const data = await response.json();
    console.log('HF response:', JSON.stringify(data));
    const text = Array.isArray(data) ? data[0]?.generated_text?.trim() : '';

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    };
}