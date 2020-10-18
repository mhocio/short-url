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
        async createUrl() {
            this.createdUrl = null;
            this.error = null;
            this.created= null;

            if (!this.useCustomSlug) {
                this.slug = '';
            }
            
            fetch('/url', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    url: this.url,
                    slug: this.slug
                })
            })
            .then((response) => {
                //console.log(response);
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error(response.status);
                }
            })
            .then (data => {
                //console.log(data);
                this.created = data;
                this.createdUrl = location.protocol + '//' + location.host + '/' + this.created.slug;
                console.log(this.createdUrl);
            })
            .catch (error => {
                //console.log(error.message);
                if (error.message == '555') {
                    console.log('Slug in use');
                    this.error = "phrase already used";
                }
            });
        }
    }
});