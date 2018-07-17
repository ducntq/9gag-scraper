import fs from 'fs';
import axios from 'axios';
import path from 'path';

export default class GagScraper {
    constructor(group = 'hot', type = 'hot', count = 100, downloadPath = './output') {
        this.group = group;
        this.type = type;
        this.count = count;
        this.downloadPath = path.resolve(downloadPath);
        fs.access(this.downloadPath, fs.constants.W_OK, (err) => {
            if (err) {
                fs.mkdir(this.downloadPath, (err) => {
                    if (err) throw new err;
                });
            }
        });
        this.param = '';
        this.total = 0;
    }

    async run() {
        let url = GagScraper.getUrl(this.group, this.type, this.param);
        console.log(`Scraping: ${url}`);
        axios.get(url).then((resp) => {
            let data = resp.data.data;
            let meta = resp.data.meta;
            if (meta.status != 'Success') {
                console.log('Process ended. Unexpected error');
                process.exit(1);
            }
            if (data.nextCursor) {
                this.param = data.nextCursor;
                if (data.posts) {
                    let promises = [];
                    for (let post of data.posts) {
                        if (post.type == 'Article') continue;
                        if (post.type == 'Animated' && post.images.image460sv.hasAudio != 1) continue;
                        
                        if (post.type == 'Photo') {
                            promises.push(axios({method: 'get', url: post.images.image700.url, responseType: 'stream'}));
                        } else if (post.type == 'Animated') {
                            promises.push(axios({method: 'get', url: post.images.image460sv.url, responseType: 'stream'}));   
                        }
                    }
                    axios.all(promises).then(((responses) => {
                        for (let resp of responses) {
                            let filename = resp.request.path.split('/')[2];
                            let path = this.downloadPath + '/' + filename;
                            console.log(`Download: ${resp.request.path}`);
                            resp.data.pipe(fs.createWriteStream(path));
                        }

                        this.run();
                    }));
                }
            } else {
                console.log('Process ended. Not enough posts to scrape');
                process.exit(0);
            }
        }).catch(err => {
            throw err;
        });
    }

    static getUrl(group, type, param = '') {
        return `https://9gag.com/v1/group-posts/group/${group}/type/${type}?${param}`;
    }
}