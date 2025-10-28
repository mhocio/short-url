var app = new Vue({
    el: '#app',
    data: {
        url: '',
        slug: '',
        created: null,
        useCustomSlug: false,
        createdUrl: null,
        error: null,
    },
    methods: {
        // Create a short URL by POSTing to /url.
        // The server now returns standard HTTP status codes and a JSON error body.
        async createUrl() {
            this.createdUrl = null;
            this.error = null;
            this.created = null;

            if (!this.useCustomSlug) {
                this.slug = '';
            }

            if (this.useCustomSlug && this.slug == '') {
                this.useCustomSlug = false;
            }

            try {
                const response = await fetch('/url', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ url: this.url, slug: this.slug })
                });

                if (!response.ok) {
                    // Attempt to parse JSON error body from server.
                    let body = null;
                    try { body = await response.json(); } catch (e) { /* ignore parse errors */ }
                    const message = body && body.message ? body.message : response.statusText || String(response.status);
                    throw new Error(message);
                }

                const data = await response.json();
                this.created = data;
                this.createdUrl = location.protocol + '//' + location.host + '/' + this.created.slug;
            } catch (error) {
                // Server now returns 'Slug in use.' message for conflicts (HTTP 409).
                if (error && error.message === 'Slug in use.') {
                    this.error = "phrase already used";
                } else {
                    this.error = "something went wrong\nenter a full URL with http:// or https://";
                }
            }
        }
    }
});