const express = require('express');
const path = require("path")
const URL = require('url')
const mysql = require('mysql')
const cors = require('cors')

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'shorturl'
})

const app = express()

app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));
app.use(cors())

const port = 3000

const allowedHostnames = ['gaoshengjie.com', 'gaoshengjie.cn', 'gov.cn', 'edu.cn']


const getRandomString = () => {
    const len = 5
    let _charStr = 'abacdefghjklmnopqrstuvwxyzABCDEFGHJKLMNOPQRSTUVWXYZ',
        min = 0,
        max = _charStr.length - 1,
        _str = '';
    //循环生成字符串
    for (var i = 0, index; i < len; i++) {
        index = ((randomIndexFunc, i) => randomIndexFunc(min, max, i, randomIndexFunc))((min, max, i, _self) => {
            let indexTemp = Math.floor(Math.random() * (max - min + 1) + min),
                numStart = _charStr.length - 10;
            if (i == 0 && indexTemp >= numStart) {
                indexTemp = _self(min, max, i, _self);
            }
            return indexTemp;
        }, i);
        _str += _charStr[index];
    }
    return _str;
}

app.post('/create', (req, res) => {
    connection.connect();
    const url = req.body.url;
    if (url) {
        const hostname = URL.parse(url).hostname
        if (hostname) {
            let allow = false
            allowedHostnames.forEach(e => {
                if (hostname.split(e).at(-1) === '') {
                    allow = true
                }
            })
            if (allow) {
                // 是否已经记录了这个网址
                let shortURL
                connection.query(`SELECT oldurl, shorturl FROM shorturl WHERE oldurl = "${url}"`, (err, res1) => {
                    if (err) {
                        console.error(err)
                    }
                    if (res1[0]) {
                        shortURL = res1[0].shorturl
                    }
                    if (!shortURL) {
                        // 一直筛选出不重复的短网址
                        const getshorturl = () => {
                            shortURL = getRandomString()
                            connection.query(`SELECT oldurl, shorturl FROM shorturl WHERE shorturl = '${shortURL}'`, (err, res1) => {
                                if (err) {
                                    console.error(err)
                                }
                                if (res1) {
                                    if (res1.length === 0) {
                                        connection.query(`INSERT INTO shorturl (oldurl,shorturl) VALUES ('${url}','${shortURL}')`, err => {
                                            if (err) {
                                                console.error(err)
                                            }
                                            res.json({
                                                code: 1,
                                                url: shortURL
                                            })
                                        })
                                    } else {
                                        getshorturl();
                                    }
                                } else {
                                    getshorturl();
                                }
                            })
                        }
                        getshorturl()

                    } else {
                        res.json({
                            code: 1,
                            url: shortURL
                        })
                    }
                })
            } else {
                res.json({
                    code: 0,
                    msg: '主机名不被允许'
                })
            }
        } else {
            res.json({
                code: 0,
                msg: '没有主机名'
            })
        }
    } else {
        res.json({
            code: 0,
            msg: '没有传入URL'
        })
    }
    connection.end()
    return;
})

app.get('/:url', (req, res) => {
    const url = req.params.url
    connection.query(`SELECT oldurl, shorturl FROM shorturl WHERE shorturl = "${url}"`, (err, res1) => {
        if (err) {
            console.error(err)
        }
        if (res1[0]) {
            res.send(`<script>window.location.href="${res1[0].oldurl}"</script>`)
        } else {
            res.sendFile(path.join(__dirname, './public/error.html'));
        }
        return;
    })
})

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './public/home.html'));
})

app.get('/a/a', (req, res) => {
    res.sendFile(path.join(__dirname, './public/sb.html'));
})

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}!`)
})