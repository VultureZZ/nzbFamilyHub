function imgError (img) {
  $(img).attr("src","images/poster-dark.jpg");
}
var seriesArray = [];

$( document ).ready(function() {
  $("#search").keyup(function (e) {
      if (e.keyCode == 13) {
          console.log('Search Started', $("#search").val());
          $('div.row').remove("");
          $('#search').attr('disabled',true);

          $.get( "/calls/search", {search: $("#search").val()}, function( data ){
            var series = data[0].reverse();
            var movies = data[1].reverse();

            _.each(series, function(result) {

              if (result.series) {
                var tracktLink = result.series.toLowerCase().replace(/ /g, '-').replace(/[^a-zA-Z0-9-]/g, '');

                var panel = "<button class='btn add-series' id='" + result.tvdbId + "'>Download Now</button>";

                var additionalSpans = "";

                var downloadOptions = '<select id="' + result.tvdbId + 'Selector" class="seriesSelector" style="margin: 8px; width: 125px; height: 20px;"><option value="recentEpisode">Recent Episode</option><option value="recentSeason">Recent Season</option><option value="pilot2">Pilot + 2 Episodes</option><option value="firstSeason">First Season</option><option value="everything">Everything</option></select>';
                var additionalSelector = "";

                if (result.monitored) {
                  panel = "<button class='btn update-series btn-success' id='" + result.tvdbId + "'>Available Now</button>";
                  downloadOptions = '<select id="' + result.tvdbId + 'Selector" class="seriesSelector" style="margin: 8px; width: 125px; height: 20px;"><option value="getMore">Get More</option><option value="completeSeason">Complete Season</option><option value="getAll">Get All</option></select>';
                } else {
                  additionalSelector += '<form class="seriesType' + result.tvdbId + '"><label class="radio"><input type="radio" name="seriesType' + result.tvdbId + '" id="inlineRadio1" value="standard" checked> Standard</label><label class="radio"><input type="radio" name="seriesType' + result.tvdbId + '" id="inlineRadio2" value="anime"> Anime</label><label class="radio"><input type="radio" name="seriesType' + result.tvdbId + '" id="inlineRadio3" value="daily"> Daily</label></form>';
                }

                if (result.seasons) {
                  additionalSpans += " <span class='label label-primary'>" + ( result.seasons.length - 1) + " Seasons</span>";
                }

                if (result.nextAiring) {
                  additionalSpans += " <span class='label label-primary'>Next Airing: " + moment(result.nextAiring).format("MM/DD/YYYY") + "</span>";
                }

                var div = "<div class='row'><div class='col-md-2'><a href='http://trakt.tv/show/" + tracktLink + "'' target='_blank'><img class='new-series-poster' src='" + result.image + "' onerror='imgError(this)'></a></div><div class='col-md-10'><div class='row'><h2 class='series-title text-left'>" + result.series + " <span class='year'>(" + result.year + ")</span><span class='labels'><span class='label label-primary'>" + result.network + "</span>" + additionalSpans + " <span class='label label-warning'>TV Series</span></span></h2></div><div class='row new-series-overview x-overview' style='word-wrap: break-word;'><div class='overview-internal text-left'>" + result.overview + "</div><div class='row'></div><div class='row'><div class='col-md-2 col-md-offset-10'>" + panel +  downloadOptions +  additionalSelector + "</div></div></div></div>";

                $('.add-series-screen').after(div);

                if (!result.monitored) {
                  $('#' + result.tvdbId + 'Selector').hide();
                  $('.seriesType' + result.tvdbId).hide();
                }

                seriesArray[result.tvdbId] = result;
              }
            });
          
            _.each(movies, function(result) {
              if (result.name) {
                var tracktLink = result.name.toLowerCase().replace(/ /g, '-').replace(/[^a-zA-Z0-9-]/g, '') + "-" + moment(result.released).format("YYYY");

                var panel = "<button class='btn add-movie' id='" + result.imdb + "'>Download Now</button>";

                if (result.in_wanted) {
                  panel = "<button class='btn add-movie btn-warning disabled'>Pending</button>";
                }               

                if (result.in_library) {
                  panel = "<button class='btn add-movie btn-success disabled'>Available Now</button>";
                }

                var div = "<div class='row'><div class='col-md-2'><a href='http://trakt.tv/movie/" + tracktLink + "'' target='_blank'><img class='new-series-poster' src='" + result.image + "' onerror='imgError(this)'></a></div><div class='col-md-10'><div class='row'><h2 class='series-title text-left'>" + result.name + " <span class='year'>(" + result.runtime + " mins)</span><span class='labels'><span class='label label-primary'>" + result.released + "</span> <span class='label label-danger'>Movie</span></span></h2></div><div class='row new-series-overview x-overview' style='word-wrap: break-word;'><div class='overview-internal text-left'>" + result.plot + "</div><div class='row'></div><div class='row'><div class='col-md-2 col-md-offset-10'>" + panel + "</div></div></div></div>";

                $('.add-series-screen').after(div);
              }
            });

            $(".add-movie").click( function(event){
              $(this).attr('disabled',true);
              $(this).html('Queuing');

              $.get( "/calls/queue/movie", {imdb: event.target.id}, function( data ){
                if (data.success) {
                  $(this).html('Pending');
                  $(this).addClass('btn-warning');
                } else {
                  $(this).html('Error');
                  $(this).addClass('btn-danger');
                }
              });
            });

            $(".update-series").click( function(event){
              $(this).attr('disabled',true);
              $(this).removeClass('btn-success');
              $(this).html('Queuing');
              $('#' + $(this).attr("id") + "Selector").hide();

              var method = $('#' + $(this).attr("id") + "Selector").val();
              var thisElement = $(this);

              $.get( "/calls/queue/update-series", {method: method, id: seriesArray[$(this).attr("id")].id}, function( data ){

                if (data.success) {
                  thisElement.html('Pending');
                  thisElement.addClass('btn-warning');
                  setTimeout( function () {
                    $(this).attr('disabled', false);
                    thisElement.html('Available Now');
                    thisElement.addClass('btn-success');
                    thisElement.removeClassv('btn-warning');
                  }, 10000);
                } else {
                  thisElement.html('Error');
                  thisElement.addClass('btn-danger');
                }
              });
            });

            $(".add-series").click( function(event){
              $(this).addClass('btn-primary');
              $(this).addClass('add-series-confirm');
              $(this).html('Confirm');
              $(this).removeClass('add-series');
              $('#' + $(this).attr("id") + "Selector").show();  
              $('.seriesType' + $(this).attr("id")).show();      

              $(".add-series-confirm").click( function(event){
                $(this).attr('disabled',true);
                $(this).removeClass('btn-primary');
                $(this).html('Queuing');
                $('#' + $(this).attr("id") + "Selector").hide();
                $('.seriesType' + $(this).attr("id")).hide();
                var method = $('#' + $(this).attr("id") + "Selector").val();
                var seriesType = $('.seriesType' + $(this).attr("id")).val();
                var thisElement = $(this);

                var seriesType = "standard";

                if (seriesType) {
                  seriesType = "anime";
                }

                $.get( "/calls/queue/series", {seriesType: seriesType, method: method, model: seriesArray[$(this).attr("id")]}, function( data ){
                  
                  data = JSON.parse(data);
                  
                  if (data.id) {
                    thisElement.html('Pending');
                    thisElement.addClass('btn-warning');
                  } else {
                    thisElement.html('Error');
                    thisElement.addClass('btn-danger');
                  }
                });
              });
            });

            $('#search').attr('disabled',false);
          }, "json");   

      }
  });

});