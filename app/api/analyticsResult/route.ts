import type { NextApiRequest, NextApiResponse } from 'next'

type ResponseData = {
    message: string
}

// export default function handler(
//     req: NextApiRequest,
//     res: NextApiResponse<ResponseData>
// ) {
//     res.status(200).json({ message: 'Hello from Next.js!' })
// }

export async function GET() {
    // const res = await fetch('https://data.mongodb-api.com/...', {
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'API-Key': process.env.DATA_API_KEY,
    //     },
    // })
    // const data = await res.json()
    //
    // return Response.json({ message: 'Hello from Next.js!' });
}
