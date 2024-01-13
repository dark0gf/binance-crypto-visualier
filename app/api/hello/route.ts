import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
    message: string
}

// export default function handler(
//     req: NextApiRequest,
//     res: NextApiResponse<ResponseData>
// ) {
//     res.status(200).json({ message: 'Hello from Next.js!' })
// }

export async function GET(req: NextApiRequest) {
    console.log(req);
    return Response.json({ message: 'Hello from Next.js!' });
}

