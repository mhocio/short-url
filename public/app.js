var app = new Vue({
    el: '#app',
    data: {
        url: '',
        slug: '',
        created: null,
        useCustomSlug: false
    },
    methods: {
        async createUrl() {
            if (!this.useCustomSlug) {
                this.slug = '';
            }
            const response = await fetch('/url', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    url: this.url,
                    slug: this.slug
                })
            });

            this.created = await response.json();
        }
    }
});