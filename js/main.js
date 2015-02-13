var App = {};
var PRECISION = 1;

$(document).on('pageinit', '#top', function() {
    $.ajax({
            url: 'csvData/new_kyoto.json',
            type: 'GET',
            dataType: 'json'
        })
        .success(function(data) {
            App.kyoto = data;
            App.arriveGoals = [];

            console.log('Loaded JSON Data');
            // console.log(data);
        })
        .error(function() {
            alert('問題が発生しました．アプリを再起動してください．');
        });
    // $('#main li[name="hint2"]').css('visibility', 'hidden');

    console.log('Initialize Top Page');
});

$(document).on('pageshow', '#top', function() {

});

$(document).on('pageinit', '#main', function() {
    App.setGoal = function() {
        App.homeNum = Math.floor(Math.random() * App.kyoto.length);

        for (var i = 0; i < App.arriveGoals.length; i++) {
            if (App.homeNum == App.arriveGoals[i]['num']) {
                App.homeNum = Math.floor(Math.random() * App.kyoto.length);
                i = -1;
            }
        }

        if (typeof App.geoClient !== 'undefined') {
            App.geoClient.clearWatchPosition();
            // $('#main li[name="hint2"]').css('visibility', 'hidden');

        } else {
            App.geoClient = new GeoLocation();
        }

        App.geoClient.watchCurrentPosition(function(pos) {
            var currentLat = pos.coords.latitude;
            var currentLong = pos.coords.longitude;

            var distance = Math.floor(App.geoClient.getGeoDistance( // 距離
                App.kyoto[App.homeNum]['X'], App.kyoto[App.homeNum]['Y'],
                currentLat, currentLong, PRECISION
            ));
            var direction = App.geoClient.getGeoDirection( // 方向
                currentLat, currentLong,
                App.kyoto[App.homeNum]['X'], App.kyoto[App.homeNum]['Y']
            );

            /* TODO: このままでは条件を満たす度に毎回生成されるので対策を考える */
            if (distance <= 2000) {
                $('#main li[name="hint2"]').css('visibility', 'visible');
            }

            if (App.distance <= 500) {
                App.geoClient.clearWatchPosition();
                window.location.href = '#jump';
            }

            $('div[name="destinationInfo"]').find('span[name="direct"]').html(direction);
            $('div[name="destinationInfo"]').find('span[name="dist"]').html(distance);
        });
    };
    App.setGoal();

    $('#main img[name="research"], #top div[name="startButton"]').on('click', function() {
        if (App.arriveGoals.length == App.kyoto.length) {
            alert('全ての施設を回りました！おめでとうございます！');
        } else {
            App.setGoal();
        }
    });

    $(document).on('click', ".hintbutton", function() {
        var count = 1;
        var hinttxt = { //ヒントのレベル別オブジェクトを作成
            'hint1': App.kyoto[App.homeNum]['hint1'],
            'hint2': App.kyoto[App.homeNum]['hint2'],
        };

        for (var key in hinttxt) {
            if (key == $(this).attr("name")) {
                $('#hint p[name="hint"]').text('ヒント' + count);
                $('#hint div[name="description"]').html('<p>' + hinttxt[key] + '</p>');
            } else {
                count++;
            }
        }
    });

    console.log('Loaded Main Page');
});


$(document).on('pageshow', '#main', function() {

    console.log('Loaded Main Page');
});

$(document).on('pageinit', '#jump', function() {
    $(document).on('click', "#jump", function() {
        var template = '<li name="place' + App.homeNum + '">' +
            '<a href="#detailFootprint">' +
            '<img src="imgs/arashiyama/' + App.kyoto[App.homeNum]['picture_pass'] + '.jpg">' +
            '<h2>' + App.kyoto[App.homeNum]['goal'] + '</h2>' +
            '</a></li>';
        $('#footprints').find('ul').append(template);

        App.arriveGoals.push({
            'num': App.homeNum,
            'comment': '',
            'photo': ''
        });

        var activity = new MozActivity({
            name: 'pick',
            data: {
                type: 'image/jpeg'
            }
        });

        activity.onsuccess = function() {
            console.log('SUCCESS(activity): ', this.result);
            var imgSrc = window.URL.createObjectURL(this.result.blob);
            App.arriveGoals[App.arriveGoals.length - 1]['photo'] = imgSrc;
            // $('#detailFootprint div[name="placeImg"]').html('<img src="' + imgSrc + '" height="120">');
            window.location.href = '#goal';
        };

        activity.onerror = function() {
            console.error('ERROR(activity):', this.error);
        };
    });
});

$(document).on('pageinit', '#goal', function() {
    // $('#titleDialog a[href="#footprints"]').on('click', function() {
    //     // var activity = new MozActivity({
    //     //     name: 'pick',
    //     //     data: {
    //     //         type: 'image/jpeg'
    //     //     }
    //     // });

    //     activity.onsuccess = function() {
    //         console.log('SUCCESS(activity): ', this.result);
    //         var imgSrc = window.URL.createObjectURL(this.result.blob);
    //         App.arriveGoals[App.arriveGoals.length - 1]['photo'] = imgSrc;
    //         $('#detailFootprint div[name="placeImg"]').html('<img src="' + imgSrc + '" height="120">');
    //     };

    //     activity.onerror = function() {
    //         console.error('ERROR(activity):', this.error);
    //     };
    // });

    console.log('Loaded Goal Page');
});

$(document).on('pageshow', '#goal', function() {
    if (App.kyoto[App.homeNum]['picture'] === '1') {
        $(this).find('div[name="placeImg"]')
            .html('<img src="imgs/arashiyama/' + App.kyoto[App.homeNum]['picture_pass'] + '.jpg" width="165px" height="180px">');
    } else {
        $(this).find('div[name="placeImg"]')
            .html('<div width="165px" height="180px"><p>No Data</p></div>');
    }

    $(this).find('div[name="placeName"]').html('<p>' + App.kyoto[App.homeNum]['goal'] + '</p>');
    $(this).find('div[name="description"]').html('<p>' + App.kyoto[App.homeNum]['information'] + '</p>');

    console.log('Loaded Goal Page');
});

$(document).on('pageinit', '#footprints', function() {

    $(document).on('click', '#footprints ul li', function() {
        App.currentPlace = $(this).attr('name').split('place')[1] - 0;

        for (var i = 0; i < App.arriveGoals.length; i++) {
            if (App.currentPlace == App.arriveGoals[i]['num']) {

                if (App.arriveGoals[App.arriveGoals.length - 1]['photo'] !== '') {
                    $('#detailFootprint div[name="placeImg"]')
                        .html('<img src="' + App.arriveGoals[i]['photo'] + '" height="120">');
                } else {
                    $('#detailFootprint div[name="placeImg"]').html('<img src="./imgs/kyoto/camera.jpg" alt="カメラ" height="120">');
                }
                $('#detailFootprint div[name="description"]').html('<p>' + App.kyoto[App.currentPlace]['information'] + '</p>');
                $('#detailFootprint div[name="comment"]').html('<p>' + App.arriveGoals[i]['comment'] + '</p>');

                break;
            }
        }
    });
});

$(document).on('pageshow', '#footprints', function() {
    $(this).find('ul').listview('refresh');
    $(this).find('span[name="rate"]').text(Math.floor(App.arriveGoals.length / App.kyoto.length * 100));
});

$(document).on('pageinit', '#detailFootprint', function() {
    $('#detailFootprint div[name="placeImg"]').on('click', function() {
        var activity = new MozActivity({
            name: 'pick',
            data: {
                type: 'image/jpeg'
            }
        });

        activity.onsuccess = function() {
            console.log('SUCCESS(activity): ', this.result);
            var imgSrc = window.URL.createObjectURL(this.result.blob);

            for (var i = 0; i < App.arriveGoals.length; i++) {
                if (App.currentPlace == App.arriveGoals[i]['num']) {
                    App.arriveGoals[i]['photo'] = imgSrc;
                    $('#detailFootprint div[name="placeImg"]').html('<img src="' + imgSrc + '" height="120">');

                    var now = new Date();
                    var yobi= ["日","月","火","水","木","金","土"];
                    $('#detailFootprint div[name="pictureDay"]')
                        .html('<p>' + now.getFullyear() + '年' + (now.getMonth() + 1) + '月' + yobi[now.getDay()] + '日撮影</p>');
                    break;
                }
            }
        };

        activity.onerror = function() {
            console.error('ERROR(activity):', this.error);
        };
    });

    $('#commentDialog a[name="writeComment"]').on('click', function() {
        for (var i = 0; i < App.arriveGoals.length; i++) {
            if (App.currentPlace == App.arriveGoals[i]['num']) {
                App.arriveGoals[i]['comment'] = $('#commentDialog textarea').val();
                $('#detailFootprint div[name="comment"]').html('<p>' + App.arriveGoals[i]['comment'] + '</p>');
                break;
            }
        }
        $('#commentDialog textarea').val('');
    });
});