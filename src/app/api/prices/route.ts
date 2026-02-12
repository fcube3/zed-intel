import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch("https://data-asg.goldprice.org/dbXRates/USD", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://goldprice.org/'
      },
      next: { revalidate: 10 } // Cache for 10s
    });
    
    if (!res.ok) throw new Error('Failed to fetch prices');
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 });
  }
}
