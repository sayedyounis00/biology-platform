const supabaseUrl = "https://mopkysmpqwkzunzdgkdd.supabase.co";
const supabaseKey = "sb_publishable__UR4ggvPCwvrTsYjJSVl1w_W4nINk9g";

async function check() {
  const res = await fetch(`${supabaseUrl}/rest/v1/lessons?select=*`, {
    headers: {
      "apikey": supabaseKey,
      "Authorization": `Bearer ${supabaseKey}`
    }
  });
  const data = await res.json();
  const withAttachments = data.find(d => d.attachment_urls && d.attachment_urls.length > 0);
  console.log("lesson with attachments:", withAttachments);
}

check();
