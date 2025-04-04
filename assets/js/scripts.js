$(document).ready(function() {
    delegatesDataURL = "http://delegates.xcash.foundation/getdelegates";
    lastBlockDataURL = "https://explorer.getxcash.org/getlastblockdata";

    totalBlocksPerDay = 288;
    totalBlockVerifiers = 45;

    myVoteAmount = 2000000;
    daysToCalculate = $( "input[type='radio']:checked" ).val();

    $("#calculate").click(function(){
        amountValue = $("#amount").val();
        daysToCalculate = $( "input[type='radio']:checked" ).val();
        if(amountValue == ""){
            myVoteAmount = 2000000;
        }else{
          if(amountValue.includes("k") || amountValue.includes("K")){
              myVoteAmount = (amountValue.replace(/["kK"]/,"") * 1000);
          } else if(amountValue.includes("m") || amountValue.includes("M")){
              myVoteAmount = (amountValue.replace(/["mM"]/,"") * 1000000);
          } else {
              myVoteAmount = (amountValue * 1);
          }
        }
        populateTable();
    });
});

function populateTable(){
    $.getJSON(lastBlockDataURL, function(blockData) {
        var dailyBlocks         = (totalBlocksPerDay / totalBlockVerifiers);
        var blockHeight         = (blockData.block_height * 1);
        var blockRewardAmount   = (blockData.block_reward * 1);
        var dailyRewardAmount   = (blockRewardAmount * dailyBlocks);

        if(blockHeight < 800000){
            blockRewardAmount = (blockRewardAmount * 2);
            dailyRewardAmount = (dailyRewardAmount * 2);
        }

        var totalRewardAmount       = (dailyRewardAmount * daysToCalculate);

        $.getJSON(delegatesDataURL, function(delegateData) {
            var delegateDataSet = [];

            console.log(delegateData[49].total_vote_count);
            var top50_treshhold = delegateData[49].total_vote_count;

            $.each(delegateData, function(i, field) {
                if( (field.shared_delegate_status == "shared" || field.shared_delegate_status == "group")
                      && field.online_status == "true"
                      && ((field.total_vote_count / 1000000) + myVoteAmount) > (top50_treshhold / 1000000) ) {

                    var totalRewardFeeAmount    = (totalRewardAmount * field.delegate_fee / 100);
                    var totalRewardToDistribute = (totalRewardAmount - totalRewardFeeAmount);
                    var totalVotes              = ((field.total_vote_count / 1000000) + myVoteAmount); // Actual votes + voted amount
                    var myVoteReturnPct         = ((myVoteAmount * 100) / totalVotes);
                    var myVoteReturnAmount      = ((myVoteReturnPct * totalRewardToDistribute) / 100);
                    var myVoteReturnROIPct      = ((myVoteReturnAmount * 100) / myVoteAmount);

                    var fields = [
                        "",
                        '<span class="'+  ((i + 1) <= 50 ? 'Online' : 'Offline') +'">' + (i + 1) + '</span>',
                        '<a class="delegate_link tip" href="http://delegates.xcash.foundation/delegates/delegate_statistics?data='+ field.delegate_name +'" aria-label="Visit '+ field.delegate_name +'" title="Visit '+ field.delegate_name +'">' + field.delegate_name.slice(0, 25) + '</a>',
                        (field.shared_delegate_status === 'solo') ? '<span class="material-icons">person_outline</span>' : ((field.shared_delegate_status === 'shared') ? '<span class="material-icons">groups</span>' : '<span class="material-icons">lock</span>'),
                        totalVotes.toLocaleString(undefined, {maximumFractionDigits: 0})+' XCA',
                        (field.delegate_fee) ? field.delegate_fee+'%' : 'N/A',
                        myVoteReturnROIPct.toFixed(2)+'%',
                        myVoteReturnAmount.toLocaleString(undefined, {maximumFractionDigits: 1})+' XCA'
                    ];

                    delegateDataSet.push(fields);
                };
            });

            var table = $('#delegatesTable').DataTable({
                destroy: true,
                "bScrollCollapse": false,
                "bPaginate": false,
                "dom": "<'row'<'col-lg-12 col-md-12 col-xs-12'f><'col-lg-0 col-md-0 col-xs-12'l>>" +
           "<'row'<'col-sm-12'tr>>" +
           "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
                responsive: {
                    details: {
                        type: 'column'
                    }
                },
                columnDefs: [{
                    className: 'dtr-control',
                    orderable: false,
                    targets:   0
                }],
                order: [ 6, 'desc' ],

                data: delegateDataSet,
                language: {
                    search: "_INPUT_",
                    searchPlaceholder: "Search Delegates..."
                },
                columns: [
                    { title: "" },
                    { title: "Rank", responsivePriority: 1 },
                    { title: "Delegate Name", responsivePriority: 2 },
                    { title: "Mode" },
                    { title: "Votes + myVote" },
                    { title: "Fee %" },
                    { title: "ROI %", responsivePriority: 3 },
                    { title: "Profit", responsivePriority: 4 },
                ]
            });
        });
    });
}
