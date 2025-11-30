import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (!userId) {
            console.error('Missing userId in session metadata');
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // Determine credits based on amount or price ID
        // For now, we'll assume a fixed amount or logic based on price
        // You can expand this logic to map price IDs to credit amounts
        let creditsToAdd = 0;

        // Example logic: Map price IDs to credits
        // Replace these with your actual Price IDs from Stripe Dashboard
        // const PRICE_ID_BASIC = 'price_...';
        // const PRICE_ID_PRO = 'price_...';

        // if (session.amount_total === 1000) creditsToAdd = 20; // Example fallback

        // For this implementation, we'll default to 20 credits for any purchase 
        // unless you want to fetch the line items to be precise.
        // A better way is to pass the credit amount in metadata too, but for security, 
        // mapping Price ID on server is safer.

        // Let's assume a standard pack is 20 credits for now.
        creditsToAdd = 20;

        console.log(`Adding ${creditsToAdd} credits to user ${userId}`);

        const { error } = await supabaseAdmin.rpc('increment_credits', {
            user_id: userId,
            amount: creditsToAdd,
        });

        if (error) {
            // If RPC fails (maybe function doesn't exist), try direct update
            console.warn('RPC increment_credits failed, trying direct update:', error);

            const { data: userProfile, error: fetchError } = await supabaseAdmin
                .from('profiles') // Assuming you have a profiles table
                .select('credits')
                .eq('id', userId)
                .single();

            if (fetchError) {
                console.error('Error fetching user profile:', fetchError);
                return NextResponse.json({ error: 'Error fetching user' }, { status: 500 });
            }

            const newCredits = (userProfile?.credits || 0) + creditsToAdd;

            const { error: updateError } = await supabaseAdmin
                .from('profiles')
                .update({ credits: newCredits })
                .eq('id', userId);

            if (updateError) {
                console.error('Error updating credits directly:', updateError);
                return NextResponse.json({ error: 'Error updating credits' }, { status: 500 });
            }
        }
    }

    return NextResponse.json({ received: true });
}
