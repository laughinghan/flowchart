require 'sinatra'
require 'erubis'

#templates are just in .
set :views, File.dirname(__FILE__)

get '/' do
  erb :flowchart
end

get '/dev' do
  @dev = true
  erb :flowchart
end
