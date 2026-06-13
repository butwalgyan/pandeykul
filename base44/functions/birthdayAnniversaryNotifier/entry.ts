/**
 * birthdayAnniversaryNotifier — TEMPORARILY DISABLED
 *
 * TODO: Re-enable this feature using Supabase Edge Function + Cron.
 * Migration plan:
 *   1. Create a Supabase Edge Function (e.g. `birthday-anniversary-notifier`) that
 *      queries `family_members` for upcoming birthdays, wedding anniversaries, and
 *      death anniversaries (next 7 days).
 *   2. Query `auth.users` (or a profiles table) for recipient emails.
 *   3. Dedupe against today's rows in `notifications`, then insert new notifications.
 *   4. Send emails via a provider (Resend, SendGrid, etc.) from the Edge Function.
 *   5. Schedule daily execution with Supabase Cron (pg_cron) or an external scheduler
 *      hitting the Edge Function endpoint.
 *
 * The original Base44 implementation is preserved below (commented out) for reference.
 */

// TODO: Remove Base44 SDK once Supabase Edge Function is live.
// import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (_req) => {
  return Response.json({
    success: true,
    disabled: true,
    message:
      'birthdayAnniversaryNotifier is temporarily disabled. ' +
      'Pending migration to Supabase Edge Function + Cron.',
  });
});

/*
// ── Original Base44 implementation (disabled) ──────────────────────────────────

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    // TODO: Replace with Supabase service-role client
    const base44 = createClientFromRequest(req);

    // TODO: Replace with supabase.from('family_members').select('*')
    const members = await base44.asServiceRole.entities.FamilyMember.list();

    // TODO: Replace with supabase.auth.admin.listUsers() or profiles query
    const users = await base44.asServiceRole.entities.User.list();

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    const upcoming = [];

    for (const member of members) {
      if (member.date_of_birth && !member.date_of_death) {
        const dob = new Date(member.date_of_birth);
        if (!isNaN(dob)) {
          const age = today.getFullYear() - dob.getFullYear();
          for (let offset = 0; offset <= 7; offset++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() + offset);
            if (
              dob.getMonth() + 1 === checkDate.getMonth() + 1 &&
              dob.getDate() === checkDate.getDate()
            ) {
              const label = offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : `In ${offset} days`;
              upcoming.push({
                message: `🎂 ${label}: ${member.full_name}'s birthday (turning ${age})`,
                subject: `🎂 Birthday Reminder — ${member.full_name}`,
                emailBody: `<p>This is a reminder that <strong>${member.full_name}</strong>'s birthday is <strong>${label.toLowerCase()}</strong> — they are turning <strong>${age}</strong>.</p><p>Visit the family archive to see their profile.</p>`,
                type: "update",
                related_member_id: member.id,
              });
              break;
            }
          }
        }
      }

      if (member.marriage_date && !member.date_of_death) {
        const md = new Date(member.marriage_date);
        if (!isNaN(md)) {
          const years = today.getFullYear() - md.getFullYear();
          for (let offset = 0; offset <= 7; offset++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() + offset);
            if (
              md.getMonth() + 1 === checkDate.getMonth() + 1 &&
              md.getDate() === checkDate.getDate()
            ) {
              const label = offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : `In ${offset} days`;
              upcoming.push({
                message: `💍 ${label}: ${member.full_name}'s wedding anniversary (${years} year${years !== 1 ? "s" : ""})`,
                subject: `💍 Anniversary Reminder — ${member.full_name}`,
                emailBody: `<p>This is a reminder that <strong>${member.full_name}</strong>'s wedding anniversary is <strong>${label.toLowerCase()}</strong> — celebrating <strong>${years} year${years !== 1 ? "s" : ""}</strong> together.</p>`,
                type: "update",
                related_member_id: member.id,
              });
              break;
            }
          }
        }
      }

      if (member.date_of_death) {
        const dod = new Date(member.date_of_death);
        if (!isNaN(dod)) {
          const years = today.getFullYear() - dod.getFullYear();
          for (let offset = 0; offset <= 7; offset++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() + offset);
            if (
              dod.getMonth() + 1 === checkDate.getMonth() + 1 &&
              dod.getDate() === checkDate.getDate()
            ) {
              const label = offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : `In ${offset} days`;
              upcoming.push({
                message: `🕯️ ${label}: ${member.full_name}'s death anniversary (${years} year${years !== 1 ? "s" : ""} ago)`,
                subject: `🕯️ In Remembrance — ${member.full_name}`,
                emailBody: `<p>This is a gentle reminder that the death anniversary of <strong>${member.full_name}</strong> is <strong>${label.toLowerCase()}</strong> — it has been <strong>${years} year${years !== 1 ? "s" : ""}</strong>.</p><p>May their memory continue to live on in our family.</p>`,
                type: "update",
                related_member_id: member.id,
              });
              break;
            }
          }
        }
      }
    }

    // TODO: Replace with supabase.from('notifications').select('*').gte('created_date', todayStr)
    const existingToday = await base44.asServiceRole.entities.Notification.list("-created_date", 200);
    const existingMessages = new Set(
      existingToday
        .filter(n => n.created_date && n.created_date.slice(0, 10) === todayStr)
        .map(n => n.message)
    );

    const toCreate = upcoming.filter(n => !existingMessages.has(n.message));
    const emailList = users.filter(u => u.email).map(u => u.email);

    let emailsSent = 0;
    let notificationsCreated = 0;

    for (const notif of toCreate) {
      // TODO: Replace with supabase.from('notifications').insert(...)
      await base44.asServiceRole.entities.Notification.create({
        message: notif.message,
        type: notif.type,
        related_member_id: notif.related_member_id,
        is_read: false,
      });
      notificationsCreated++;

      for (const email of emailList) {
        // TODO: Replace with email provider call from Supabase Edge Function
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject: notif.subject,
          from_name: "The Legacy Book",
          body: `
            <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #2d2d2d;">
              <h2 style="color: #8B6914; font-size: 22px; margin-bottom: 8px;">The Legacy Book</h2>
              <hr style="border: none; border-top: 1px solid #e5ddd0; margin-bottom: 24px;" />
              ${notif.emailBody}
              <br/>
              <p style="color: #888; font-size: 13px;">— The Legacy Book Family Archive</p>
            </div>
          `,
        });
        emailsSent++;
      }
    }

    return Response.json({
      success: true,
      checked: members.length,
      upcoming: upcoming.length,
      notificationsCreated,
      emailsSent,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

*/
