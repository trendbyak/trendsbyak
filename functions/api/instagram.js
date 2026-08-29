export async function onRequestGet(context) {
    const token = context.env.INSTAGRAM_ACCESS_TOKEN;

    if (!token) {
        return new Response(
            JSON.stringify({
                success: false,
                error: "Instagram API token is not configured."
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store"
                }
            }
        );
    }

    try {
        const fields = [
            "id",
            "caption",
            "media_type",
            "media_url",
            "thumbnail_url",
            "permalink",
            "timestamp"
        ].join(",");

        const apiUrl =
            `https://graph.instagram.com/me/media` +
            `?fields=${encodeURIComponent(fields)}` +
            `&limit=12` +
            `&access_token=${encodeURIComponent(token)}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!response.ok) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: data.error?.message || "Instagram API request failed."
                }),
                {
                    status: response.status,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        const posts = (data.data || [])
            .filter(post => post.media_url || post.thumbnail_url)
            .map(post => ({
                id: post.id,
                caption: post.caption || "",
                media_type: post.media_type || "IMAGE",
                image: post.media_type === "VIDEO"
                    ? (post.thumbnail_url || post.media_url)
                    : post.media_url,
                permalink: post.permalink,
                timestamp: post.timestamp
            }));

        return new Response(
            JSON.stringify({
                success: true,
                posts
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "public, max-age=900"
                }
            }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || "Unable to load Instagram posts."
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }
}
